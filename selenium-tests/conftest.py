"""
conftest.py — Global pytest fixtures for Krisha Sparkles Selenium Tests.
Sets up WebDriver, handles screenshots on failure, and manages auth sessions.
"""

import os
import time
import pytest
from datetime import datetime
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Load test env vars
load_dotenv(".env.test")

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
BROWSER = os.getenv("BROWSER", "chrome").lower()
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "10"))
PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
SCREENSHOT_ON_FAILURE = os.getenv("SCREENSHOT_ON_FAILURE", "true").lower() == "true"
SCREENSHOT_DIR = os.getenv("SCREENSHOT_DIR", "screenshots")


def pytest_configure(config):
    """Create reports and screenshots dirs if they don't exist."""
    os.makedirs("reports", exist_ok=True)
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def create_driver():
    """Factory function to create a configured WebDriver."""
    if BROWSER == "firefox":
        opts = FirefoxOptions()
        if HEADLESS:
            opts.add_argument("--headless")
        opts.set_preference("dom.webnotifications.enabled", False)
        service = FirefoxService(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service, options=opts)

    elif BROWSER == "edge":
        opts = EdgeOptions()
        if HEADLESS:
            opts.add_argument("--headless")
        service = EdgeService(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=opts)

    else:  # default: chrome
        opts = ChromeOptions()
        if HEADLESS:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1440,900")
        opts.add_argument("--disable-notifications")
        opts.add_argument("--disable-popup-blocking")
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)
        service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=opts)

    driver.implicitly_wait(IMPLICIT_WAIT)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    driver.maximize_window()
    return driver


@pytest.fixture(scope="session")
def base_url():
    """Return the base URL for all tests."""
    return BASE_URL


def _dismiss_cookie_banner(drv):
    """Try to dismiss cookie consent banner via JS or button click."""
    try:
        # Set localStorage flag to suppress future cookie banners
        drv.execute_script(
            "try { localStorage.setItem('cookie_consent', 'declined'); } catch(e) {}"
        )
        # Also click the Decline button if visible
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        try:
            btn = WebDriverWait(drv, 2).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Decline') or contains(text(),'ACCEPT')]"))
            )
            drv.execute_script("arguments[0].click();", btn)
            import time as _time
            _time.sleep(0.3)
        except Exception:
            pass
    except Exception:
        pass


@pytest.fixture(scope="function")
def driver(request):
    """
    Function-scoped WebDriver fixture.
    Creates a fresh browser for each test and takes a screenshot on failure.
    Automatically visits base URL first to enable localStorage, then dismisses cookie banner.
    """
    drv = create_driver()
    # Pre-navigate to home to set localStorage (dismissing cookie banner for all subsequent pages)
    try:
        drv.get(BASE_URL)
        _dismiss_cookie_banner(drv)
        # Set admin gate cookie so tests can navigate to /admin/login without 404
        _set_admin_gate_cookie(drv, BASE_URL)
    except Exception:
        pass
    yield drv

    # Screenshot on failure
    if SCREENSHOT_ON_FAILURE and request.node.rep_call is not None and request.node.rep_call.failed:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_name = request.node.name.replace("/", "_").replace(" ", "_")
        filename = f"{SCREENSHOT_DIR}/{test_name}_{timestamp}.png"
        try:
            drv.save_screenshot(filename)
            print(f"\n📸 Screenshot saved: {filename}")
        except Exception:
            pass

    drv.quit()


@pytest.fixture(scope="session")
def session_driver():
    """
    Session-scoped WebDriver fixture — reused across all tests in the session.
    Faster but tests share state.
    """
    drv = create_driver()
    yield drv
    drv.quit()


def _set_admin_gate_cookie(drv, base_url: str):
    """
    Set the _adm_gt gate cookie required by proxy.ts Layer 1 security.
    Must be on the correct domain before adding cookies.
    """
    gate_token = os.getenv("ADMIN_GATE_TOKEN", "")
    if not gate_token:
        print("⚠️  ADMIN_GATE_TOKEN not set in .env.test — admin routes will return 404")
        return
    try:
        drv.add_cookie({
            "name": "_adm_gt",
            "value": gate_token,
            "domain": "localhost",
            "path": "/",
        })
        print(f"✅ Admin gate cookie set")
    except Exception as e:
        print(f"⚠️  Could not set admin gate cookie: {e}")


@pytest.fixture(scope="session")
def admin_driver(base_url):
    """
    Session-scoped driver pre-logged into admin panel.
    Used for all admin page tests to avoid repeated logins.

    Sequence:
      1. Navigate to home to establish domain for cookie setting
      2. Set _adm_gt gate cookie (Layer 1 of proxy.ts security)
      3. Navigate to /admin/login (now accessible past the gate)
      4. Submit credentials (Layers 2 & 3 of proxy security)
      5. Wait for redirect to /admin dashboard
    """
    drv = create_driver()
    admin_email = os.getenv("ADMIN_EMAIL", "admin@krishasparkles.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@1234")

    # Step 1: Navigate to home to establish the domain (required before adding cookies)
    drv.get(base_url)
    time.sleep(1)

    # Step 2: Set the gate cookie that unlocks admin routes
    _set_admin_gate_cookie(drv, base_url)

    # Step 3: Navigate to admin login (now unblocked by gate cookie)
    drv.get(f"{base_url}/admin/login")
    wait = WebDriverWait(drv, 20)

    try:
        # Step 4: Fill and submit login form
        email_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_field.clear()
        email_field.send_keys(admin_email)

        password_field = drv.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_field.clear()
        password_field.send_keys(admin_password)

        submit_btn = drv.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()

        # Step 5: Wait for redirect to /admin dashboard
        wait.until(EC.url_contains("/admin"))
        time.sleep(2)
        print(f"✅ Admin logged in → {drv.current_url}")
    except Exception as e:
        print(f"⚠️  Admin login failed: {e} | URL: {drv.current_url}")

    yield drv
    drv.quit()


@pytest.fixture(scope="session")
def user_driver(base_url):
    """
    Session-scoped driver pre-logged in as a regular customer.
    """
    drv = create_driver()
    user_email = os.getenv("TEST_USER_EMAIL", "testuser@example.com")
    user_password = os.getenv("TEST_USER_PASSWORD", "TestUser@1234")

    drv.get(f"{base_url}/auth/login")
    wait = WebDriverWait(drv, 15)

    try:
        email_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_field.clear()
        email_field.send_keys(user_email)

        password_field = drv.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_field.clear()
        password_field.send_keys(user_password)

        submit_btn = drv.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()

        wait.until(EC.url_contains("/account"))
        time.sleep(1)
    except Exception as e:
        print(f"⚠️  User login failed during fixture setup: {e}")

    yield drv
    drv.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Attach test result to the request node so fixtures can access it."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
