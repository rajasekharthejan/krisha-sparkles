"""
base.py — FlowContext and FlowResult for all flow functions.
"""
import time
import os
from dataclasses import dataclass, field
from typing import Optional, Callable, List
from urllib.parse import urlparse
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


@dataclass
class FlowResult:
    flow_id: str
    passed: bool
    message: str
    duration: float
    steps: List[str] = field(default_factory=list)
    screenshot_path: Optional[str] = None


@dataclass
class FlowDef:
    id: str
    name: str
    description: str
    category: str
    execute: Callable
    requires_admin: bool = False
    requires_auth: bool = False
    tags: List[str] = field(default_factory=list)


class FlowContext:
    """
    Shared context passed to every flow function.
    Wraps both the regular driver and admin_driver with helpers.
    """

    def __init__(self, driver, admin_driver, base_url: str, log_fn=None):
        self.driver = driver
        # If no dedicated admin driver, reuse the customer driver as fallback
        self.admin_driver = admin_driver if admin_driver is not None else driver
        self.base_url = base_url.rstrip("/")
        self._log = log_fn or (lambda msg: None)
        self.steps: List[str] = []
        # Test user credentials — override via USER_EMAIL / USER_PASSWORD env vars
        self.email    = os.getenv("USER_EMAIL",    "testuser@krishasparkles.com")
        self.password = os.getenv("USER_PASSWORD", "Test@1234!")

    # ── Navigation ───────────────────────────────────────────────────

    def go(self, path: str = "", admin: bool = False) -> "FlowContext":
        d = self.admin_driver if admin else self.driver
        url = f"{self.base_url}{path}"
        d.get(url)
        self._step(f"Navigate → {url}", admin=admin)
        self._wait_ready(d)
        return self

    def _wait_ready(self, driver, timeout: int = 12):
        """Poll document.readyState — safe loop, no WebDriverWait crash."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                state = driver.execute_script("return document.readyState")
                if state == "complete":
                    return
            except Exception:
                pass
            time.sleep(0.3)

    # ── Logging ──────────────────────────────────────────────────────

    def _step(self, msg: str, admin: bool = False):
        prefix = "[ADMIN] " if admin else ""
        full = f"{prefix}{msg}"
        self.steps.append(full)
        self._log(full)

    def step(self, msg: str, admin: bool = False):
        """Public alias for _step() — used by flow files to log progress."""
        self._step(msg, admin=admin)

    # ── Element helpers ──────────────────────────────────────────────

    def _driver(self, admin: bool = False):
        return self.admin_driver if admin else self.driver

    def exists(self, by, val, timeout: int = 5, admin: bool = False) -> bool:
        """Poll with find_elements — exceptions are transient (page loading), keep retrying."""
        d = self._driver(admin)
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                if d.find_elements(by, val):
                    return True
            except Exception:
                pass  # page may still be navigating — keep polling
            time.sleep(0.3)
        return False

    def visible(self, by, val, timeout: int = 5, admin: bool = False) -> bool:
        d = self._driver(admin)
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                els = d.find_elements(by, val)
                if els and els[0].is_displayed():
                    return True
            except Exception:
                pass
            time.sleep(0.3)
        return False

    def find(self, by, val, timeout: int = 10, admin: bool = False):
        """Safe element find — polls find_elements, never crashes ChromeDriver."""
        d = self._driver(admin)
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                els = d.find_elements(by, val)
                if els:
                    return els[0]
            except Exception:
                pass
            time.sleep(0.3)
        raise TimeoutException(f"Element not found after {timeout}s: {val}")

    def find_all(self, by, val, admin: bool = False):
        d = self._driver(admin)
        try:
            return d.find_elements(by, val)
        except Exception:
            return []

    def click(self, by, val, timeout: int = 10, admin: bool = False, label: str = ""):
        d = self._driver(admin)
        # Use safe find() instead of WebDriverWait to avoid ChromeDriver crash
        el = self.find(by, val, timeout=timeout, admin=admin)
        d.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        time.sleep(0.2)
        d.execute_script("arguments[0].click();", el)
        self._step(f"Click: {label or val}", admin=admin)
        return el

    def type(self, by, val, text: str, clear: bool = True, admin: bool = False, label: str = ""):
        d = self._driver(admin)
        # Use safe find() instead of WebDriverWait to avoid ChromeDriver crash
        el = self.find(by, val, timeout=10, admin=admin)
        if clear:
            el.clear()
        el.send_keys(text)
        self._step(f"Type '{text[:30]}' → {label or val}", admin=admin)
        return el

    def select(self, by, val, option_text: str, admin: bool = False):
        from selenium.webdriver.support.ui import Select
        d = self._driver(admin)
        el = d.find_element(by, val)
        sel = Select(el)
        sel.select_by_visible_text(option_text)
        self._step(f"Select '{option_text}'", admin=admin)

    def wait_url(self, fragment: str, timeout: int = 10, admin: bool = False) -> bool:
        """Poll current URL for fragment — safe, no WebDriverWait crash."""
        d = self._driver(admin)
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                if fragment in d.current_url:
                    return True
            except Exception:
                pass
            time.sleep(0.3)
        return False

    # ── Content helpers ──────────────────────────────────────────────

    def body(self, admin: bool = False) -> str:
        d = self._driver(admin)
        try:
            return d.find_element(By.TAG_NAME, "body").text
        except Exception:
            return ""

    def url(self, admin: bool = False) -> str:
        return self._driver(admin).current_url

    def text_present(self, text: str, admin: bool = False) -> bool:
        return text.lower() in self.body(admin=admin).lower()

    def body_len(self, admin: bool = False) -> int:
        return len(self.body(admin=admin).strip())

    def sleep(self, secs: float):
        time.sleep(secs)

    def js(self, script: str, *args, admin: bool = False):
        d = self._driver(admin)
        return d.execute_script(script, *args)

    def dismiss_cookie_banner(self, admin: bool = False):
        """Set consent pref in localStorage AND remove the banner element from the DOM."""
        d = self._driver(admin)
        try:
            d.execute_script("""
                try { localStorage.setItem('cookie_consent','declined'); } catch(e) {}
                // Remove cookie banner overlay from DOM so it never blocks clicks
                var banners = document.querySelectorAll('[role="dialog"][aria-label*="ookie"], [aria-label*="ookie"]');
                banners.forEach(function(b) { b.remove(); });
                // Also hide by style as fallback
                var fixed = document.querySelectorAll('[style*="position: fixed"]');
                fixed.forEach(function(el) {
                    if (el.innerText && (el.innerText.includes('cookie') || el.innerText.includes('Cookie'))) {
                        el.style.display = 'none';
                    }
                });
            """)
        except Exception:
            pass

    def scroll_bottom(self, admin: bool = False):
        d = self._driver(admin)
        d.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(0.5)

    def screenshot(self, name: str, admin: bool = False) -> str:
        d = self._driver(admin)
        os.makedirs("screenshots", exist_ok=True)
        path = f"screenshots/{name}.png"
        d.save_screenshot(path)
        return path

    # ── Auth helpers ─────────────────────────────────────────────────

    def login_as_user(self, email: str, password: str) -> bool:
        """Log in the regular driver as a user."""
        self.go("/auth/login")
        self.dismiss_cookie_banner()
        time.sleep(1)
        if not self.exists(By.CSS_SELECTOR, "input[type='email']", timeout=8):
            return False
        self.type(By.CSS_SELECTOR, "input[type='email']", email, label="email")
        self.type(By.CSS_SELECTOR, "input[type='password']", password, label="password")
        self.click(By.CSS_SELECTOR, "button[type='submit']", label="Login submit")
        return self.wait_url("/account", timeout=8) or self.wait_url("/", timeout=5)

    def logout_user(self):
        """Log out the regular driver."""
        self.go("/auth/login")

    def add_item_to_cart(self) -> bool:
        """Navigate to shop and add first available product to cart."""
        self.go("/shop")
        time.sleep(1)
        self.dismiss_cookie_banner()  # remove banner BEFORE any clicks
        time.sleep(0.5)
        links = self.find_all(By.CSS_SELECTOR, "a[href*='/shop/']")
        if not links:
            return False
        self.js("arguments[0].click();", links[0])  # JS click bypasses any remaining overlay
        time.sleep(1.5)
        for btn in self.find_all(By.CSS_SELECTOR, "button"):
            if "add to cart" in btn.text.lower() or "add to bag" in btn.text.lower():
                self.js("arguments[0].click();", btn)
                time.sleep(1)
                self._step("Added item to cart")
                return True
        return False

    def get_first_product_slug(self) -> Optional[str]:
        """Return slug of first product in shop."""
        self.go("/shop")
        time.sleep(1)
        links = self.find_all(By.CSS_SELECTOR, "a[href*='/shop/']")
        for link in links:
            href = link.get_attribute("href") or ""
            if "/shop/" in href:
                parts = href.rstrip("/").split("/shop/")
                if len(parts) > 1:
                    slug = parts[-1].strip("/")
                    if slug:
                        return slug
        return None

    def set_admin_gate_cookie(self):
        """Set _adm_gt gate cookie for admin access."""
        gate_token = os.getenv("ADMIN_GATE_TOKEN", "ks7f2m9p4n8x3b1qZA")
        try:
            parsed = urlparse(self.base_url)
            host = parsed.hostname or "localhost"
            if host.startswith("www."):
                host = host[4:]
            self.admin_driver.add_cookie({
                "name": "_adm_gt",
                "value": gate_token,
                "domain": host,
                "path": "/",
            })
        except Exception:
            pass
