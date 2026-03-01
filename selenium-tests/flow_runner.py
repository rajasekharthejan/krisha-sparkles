"""
flow_runner.py — Runs selected flows in a background thread.
Sends results via queue to Streamlit for live display.
"""
import threading
import queue
import time
import os
from typing import List, Optional
from urllib.parse import urlparse

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

from flows.base import FlowContext, FlowResult, FlowDef


def _extract_domain(base_url: str) -> str:
    """Extract hostname from a URL for use in Selenium cookie domain."""
    parsed = urlparse(base_url)
    host = parsed.hostname or "localhost"
    if host.startswith("www."):
        host = host[4:]
    return host


def _make_driver(headless: bool = False) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1440,900")
    opts.add_argument("--log-level=3")
    opts.add_experimental_option("excludeSwitches", ["enable-logging"])
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=opts)


def _poll_find(driver, css: str, timeout: int = 15):
    """Safe element finder — no WebDriverWait, manual poll loop."""
    from selenium.webdriver.common.by import By
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            els = driver.find_elements(By.CSS_SELECTOR, css)
            if els:
                return els[0]
        except Exception:
            pass
        time.sleep(0.4)
    return None


def _setup_admin_driver(driver: webdriver.Chrome, base_url: str) -> bool:
    """Set gate cookie and log in admin driver using safe polling (no WebDriverWait)."""
    gate_token    = os.getenv("ADMIN_GATE_TOKEN", "ks7f2m9p4n8x3b1qZA")
    admin_email   = os.getenv("ADMIN_EMAIL",      "admin@krishasparkles.com")
    admin_pass    = os.getenv("ADMIN_PASSWORD",   "Admin@1234")
    cookie_domain = _extract_domain(base_url)
    try:
        driver.get(base_url)
        time.sleep(1)
        driver.add_cookie({"name": "_adm_gt", "value": gate_token,
                           "domain": cookie_domain, "path": "/"})
        driver.get(f"{base_url}/admin/login")
        time.sleep(2)

        email_el = _poll_find(driver, "input[type='email']", timeout=15)
        if not email_el:
            print("Admin login: email input not found")
            return False
        email_el.clear()
        email_el.send_keys(admin_email)

        pwd_el = _poll_find(driver, "input[type='password']", timeout=8)
        if not pwd_el:
            print("Admin login: password input not found")
            return False
        pwd_el.clear()
        pwd_el.send_keys(admin_pass)

        submit = _poll_find(driver, "button[type='submit']", timeout=5)
        if submit:
            driver.execute_script("arguments[0].click();", submit)

        # Wait for URL to move to /admin (not /admin/login)
        deadline = time.time() + 15
        while time.time() < deadline:
            try:
                cur = driver.current_url
                if "/admin" in cur and "/login" not in cur:
                    time.sleep(1)
                    return True
            except Exception:
                pass
            time.sleep(0.4)

        # Even if URL check failed, check if we're past login page
        try:
            cur = driver.current_url
            if "/admin" in cur:
                return True
        except Exception:
            pass

        print(f"Admin login: URL did not advance past login. Current: {driver.current_url}")
        return False
    except Exception as e:
        print(f"Admin login failed: {e}")
        return False


class FlowRunner:
    """
    Runs a single FlowDef in a background thread.

    Queue messages:
      {"type": "step",   "step": str}           — live step log
      {"type": "result", "passed": bool, "message": str, "duration": float, "steps": list}
      {"type": "done"}
      {"type": "error",  "message": str}
    """

    def __init__(
        self,
        flows: List[FlowDef],
        result_queue: queue.Queue,
        base_url: str = "https://krisha-sparkles.vercel.app",
        headless: bool = False,
        stop_on_fail: bool = False,
    ):
        self.flows       = flows
        self.result_queue = result_queue
        self.base_url    = base_url
        self.headless    = headless
        self.stop_on_fail = stop_on_fail
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set()

    def is_alive(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def _put(self, msg: dict):
        self.result_queue.put(msg)

    def _log(self, msg: str):
        """Send a live step update to the UI."""
        self._put({"type": "step", "step": msg})

    def _run(self):
        driver       = None
        admin_driver = None
        try:
            # ── Customer driver ───────────────────────────────────────────
            self._log("🌐 Launching Chrome…")
            driver = _make_driver(self.headless)
            driver.get(self.base_url)
            time.sleep(1)
            try:
                driver.execute_script("""
                    localStorage.setItem('cookie_consent','declined');
                    var banners = document.querySelectorAll('[role="dialog"][aria-label*="ookie"]');
                    banners.forEach(function(b){ b.remove(); });
                """)
            except Exception:
                pass

            # ── Admin driver — ONLY when the flow actually needs admin ────
            needs_admin = any(f.requires_admin for f in self.flows)
            if needs_admin:
                self._log("🔐 Logging in admin session…")
                admin_driver = _make_driver(self.headless)
                ok = _setup_admin_driver(admin_driver, self.base_url)
                if not ok:
                    self._log("⚠️  Admin login failed — admin flows may not work")
            else:
                admin_driver = None   # FlowContext falls back to driver

            # ── Run each flow ─────────────────────────────────────────────
            for flow_def in self.flows:
                if self._stop_event.is_set():
                    break

                steps_collected: List[str] = []

                def log_fn(msg):
                    # DO NOT append here — ctx._step() already appended to ctx.steps
                    # which IS steps_collected (same object via ctx.steps = steps_collected below)
                    self._put({"type": "step", "step": msg})

                ctx = FlowContext(
                    driver=driver,
                    admin_driver=admin_driver,   # None → base.py falls back to driver
                    base_url=self.base_url,
                    log_fn=log_fn,
                )
                ctx.steps = steps_collected

                t0 = time.time()
                try:
                    passed, message = flow_def.execute(ctx)
                except Exception as exc:
                    passed  = False
                    message = f"Exception: {exc}"

                duration = round(time.time() - t0, 2)

                self._put({
                    "type":     "result",
                    "passed":   passed,
                    "message":  message,
                    "duration": duration,
                    "steps":    list(steps_collected),
                })

                if not passed and self.stop_on_fail:
                    break

        except Exception as e:
            self._put({"type": "error", "message": str(e)})
        finally:
            for d in [driver, admin_driver]:
                try:
                    if d:
                        d.quit()
                except Exception:
                    pass
            self._put({"type": "done"})
