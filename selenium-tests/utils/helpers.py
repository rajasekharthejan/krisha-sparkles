"""
helpers.py — Shared helper utilities for Selenium tests.
"""

import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    ElementNotInteractableException,
)


BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")


def url(path: str) -> str:
    """Build a full URL from a path."""
    return f"{BASE_URL}{path}"


def wait_for(driver, locator, timeout=10, condition="visible"):
    """
    Wait for an element with configurable condition.
    condition: 'visible' | 'clickable' | 'present'
    """
    wait = WebDriverWait(driver, timeout)
    by, value = locator
    if condition == "clickable":
        return wait.until(EC.element_to_be_clickable((by, value)))
    elif condition == "present":
        return wait.until(EC.presence_of_element_located((by, value)))
    else:
        return wait.until(EC.visibility_of_element_located((by, value)))


def wait_for_url(driver, url_fragment, timeout=15):
    """Wait until the current URL contains the given fragment."""
    WebDriverWait(driver, timeout).until(EC.url_contains(url_fragment))


def element_exists(driver, by, value, timeout=5) -> bool:
    """Return True if the element is found within timeout, False otherwise."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        return True
    except TimeoutException:
        return False


def element_visible(driver, by, value, timeout=5) -> bool:
    """Return True if the element is visible within timeout."""
    try:
        WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
        return True
    except TimeoutException:
        return False


def safe_click(driver, element, retries=3):
    """Click an element, scrolling into view first. Retries on failure."""
    for attempt in range(retries):
        try:
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
            time.sleep(0.3)
            element.click()
            return
        except ElementNotInteractableException:
            if attempt == retries - 1:
                driver.execute_script("arguments[0].click();", element)


def scroll_to_bottom(driver):
    """Scroll the page to the bottom."""
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(0.5)


def scroll_to_top(driver):
    """Scroll the page back to the top."""
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.3)


def get_page_title(driver) -> str:
    """Return the current page <title>."""
    return driver.title


def get_heading(driver, level=1) -> str:
    """Return the text of the first h{level} element on the page."""
    try:
        el = driver.find_element(By.TAG_NAME, f"h{level}")
        return el.text.strip()
    except NoSuchElementException:
        return ""


def assert_no_console_errors(driver, allowed_patterns=None):
    """
    Check browser console for severe errors.
    allowed_patterns: list of strings to ignore.
    """
    logs = driver.get_log("browser")
    allowed = allowed_patterns or ["favicon", "fonts.googleapis", "crisp", "push"]
    severe = [
        log for log in logs
        if log.get("level") == "SEVERE"
        and not any(p in log.get("message", "") for p in allowed)
    ]
    assert len(severe) == 0, f"Console errors found:\n" + "\n".join(
        f"  • {e['message']}" for e in severe
    )


def fill_input(driver, by, value, text, clear=True):
    """Find an input and fill it with text."""
    el = driver.find_element(by, value)
    if clear:
        el.clear()
    el.send_keys(text)
    return el


def navbar_link(driver, label: str):
    """Find a navbar link by its visible text."""
    links = driver.find_elements(By.TAG_NAME, "a")
    for link in links:
        if link.text.strip().lower() == label.lower():
            return link
    return None


def count_elements(driver, by, value) -> int:
    """Return the count of elements matching the locator."""
    return len(driver.find_elements(by, value))


def hover(driver, element):
    """Hover over an element."""
    ActionChains(driver).move_to_element(element).perform()
    time.sleep(0.3)


def wait_for_page_load(driver, timeout=30):
    """Wait until document.readyState is complete."""
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def dismiss_cookie_banner(driver):
    """Try to dismiss a cookie consent banner if present."""
    for selector in [
        "button[id*='accept']",
        "button[class*='accept']",
        "[data-testid='cookie-accept']",
    ]:
        if element_exists(driver, By.CSS_SELECTOR, selector, timeout=2):
            try:
                driver.find_element(By.CSS_SELECTOR, selector).click()
            except Exception:
                pass
            return


def close_modal_if_open(driver):
    """Close an open modal dialog if one exists."""
    for selector in [
        "button[aria-label='Close']",
        "button[class*='close']",
        "[data-testid='modal-close']",
    ]:
        if element_exists(driver, By.CSS_SELECTOR, selector, timeout=2):
            try:
                driver.find_element(By.CSS_SELECTOR, selector).click()
                time.sleep(0.3)
            except Exception:
                pass
            return


def take_screenshot(driver, name: str):
    """Save a debug screenshot."""
    os.makedirs("screenshots", exist_ok=True)
    path = f"screenshots/{name}.png"
    driver.save_screenshot(path)
    return path
