"""
base_page.py — Base class for all Page Object Models.
All page-specific POMs extend this class.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class BasePage:
    """Shared methods available to all page objects."""

    DEFAULT_TIMEOUT = 10

    def __init__(self, driver, base_url: str):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, self.DEFAULT_TIMEOUT)

    # ── Navigation ───────────────────────────────────────────

    def open(self, path: str = ""):
        """Navigate to base_url + path."""
        self.driver.get(f"{self.base_url}{path}")
        self._wait_for_ready()
        return self

    def _wait_for_ready(self, timeout=20):
        """Wait until document.readyState is complete."""
        WebDriverWait(self.driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

    # ── Element finders ──────────────────────────────────────

    def find(self, by, value):
        return self.driver.find_element(by, value)

    def find_all(self, by, value):
        return self.driver.find_elements(by, value)

    def wait_visible(self, by, value, timeout=None):
        t = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located((by, value))
        )

    def wait_clickable(self, by, value, timeout=None):
        t = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.element_to_be_clickable((by, value))
        )

    def wait_present(self, by, value, timeout=None):
        t = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_element_located((by, value))
        )

    def exists(self, by, value, timeout=3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def is_visible(self, by, value, timeout=3) -> bool:
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def count(self, by, value) -> int:
        return len(self.driver.find_elements(by, value))

    # ── Interactions ─────────────────────────────────────────

    def click(self, by, value, timeout=None):
        el = self.wait_clickable(by, value, timeout)
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
        time.sleep(0.2)
        el.click()
        return el

    def type_text(self, by, value, text, clear=True):
        el = self.wait_visible(by, value)
        if clear:
            el.clear()
        el.send_keys(text)
        return el

    def scroll_to(self, element):
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        time.sleep(0.3)

    def scroll_to_bottom(self):
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(0.5)

    def scroll_to_top(self):
        self.driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(0.3)

    def hover(self, element):
        ActionChains(self.driver).move_to_element(element).perform()
        time.sleep(0.3)

    # ── Queries ──────────────────────────────────────────────

    @property
    def title(self) -> str:
        return self.driver.title

    @property
    def url(self) -> str:
        return self.driver.current_url

    def heading(self, level=1) -> str:
        try:
            return self.find(By.TAG_NAME, f"h{level}").text.strip()
        except NoSuchElementException:
            return ""

    def all_headings(self, level=1) -> list:
        return [el.text.strip() for el in self.find_all(By.TAG_NAME, f"h{level}")]

    def text_present(self, text: str, tag="body") -> bool:
        try:
            body = self.driver.find_element(By.TAG_NAME, tag)
            return text.lower() in body.text.lower()
        except Exception:
            return False

    def wait_url_contains(self, fragment: str, timeout=15):
        WebDriverWait(self.driver, timeout).until(EC.url_contains(fragment))

    # ── Navbar helpers ───────────────────────────────────────

    def navbar_links(self) -> list:
        """Return all visible anchor texts in the navbar."""
        nav = self.find_all(By.CSS_SELECTOR, "nav a")
        return [a.text.strip() for a in nav if a.text.strip()]

    def click_navbar_link(self, text: str):
        links = self.find_all(By.TAG_NAME, "a")
        for link in links:
            if link.text.strip().lower() == text.lower():
                self.scroll_to(link)
                link.click()
                return
        raise NoSuchElementException(f"Navbar link '{text}' not found")

    # ── Convenience ──────────────────────────────────────────

    def take_screenshot(self, name: str):
        import os
        os.makedirs("screenshots", exist_ok=True)
        path = f"screenshots/{name}.png"
        self.driver.save_screenshot(path)
        return path

    def wait(self, seconds: float):
        time.sleep(seconds)
