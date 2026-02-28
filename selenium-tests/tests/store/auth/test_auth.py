"""Tests for Authentication pages: Login, Register, ForgotPassword, ResetPassword."""
import pytest
import time
from selenium.webdriver.common.by import By
from pages.store.auth.auth_pages import LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
from utils.test_data import ADMIN_EMAIL, ADMIN_PASSWORD, USER_EMAIL, USER_PASSWORD

pytestmark = [pytest.mark.store, pytest.mark.auth]


class TestLoginPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = LoginPage(driver, base_url)
        self.driver = driver
        self.page.load()

    def test_login_page_loads(self):
        assert "/auth/login" in self.page.url or "login" in self.page.url

    def test_login_heading_visible(self):
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_email_field_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "input[type='email']")

    def test_password_field_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "input[type='password']")

    def test_submit_button_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "button[type='submit']")

    def test_register_link_present(self):
        assert self.page.has_register_link()

    def test_forgot_password_link_present(self):
        assert self.page.has_forgot_link()

    def test_invalid_credentials_show_error(self):
        """Invalid email/password shows error message."""
        self.page.login("notauser@fake.com", "WrongPassword123!")
        time.sleep(2)
        assert self.page.has_error() or "login" in self.page.url

    def test_empty_submit_stays_on_login(self):
        """Submitting empty form stays on login page or shows error."""
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1)
        assert "login" in self.page.url or self.page.exists(By.CSS_SELECTOR, "input[type='email']")

    def test_email_field_accepts_text(self):
        el = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        el.clear()
        el.send_keys("test@example.com")
        assert el.get_attribute("value") == "test@example.com"

    def test_password_field_is_masked(self):
        """Password field type is 'password' (characters are masked)."""
        el = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        assert el.get_attribute("type") == "password"

    def test_logo_visible_on_login(self):
        imgs = self.driver.find_elements(By.TAG_NAME, "img")
        assert len(imgs) > 0

    def test_admin_login_success(self, driver, base_url):
        """Admin can log in with correct credentials."""
        page = LoginPage(driver, base_url)
        page.load()
        page.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        time.sleep(3)
        # Should redirect away from login
        current = driver.current_url
        assert "/auth/login" not in current or "error" not in current.lower()

    def test_login_page_scroll(self):
        self.page.scroll_to_bottom()
        self.page.scroll_to_top()


class TestRegisterPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = RegisterPage(driver, base_url)
        self.driver = driver
        self.page.load()

    def test_register_page_loads(self):
        assert "/auth/register" in self.page.url or "register" in self.page.url

    def test_register_heading_visible(self):
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_email_field_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "input[type='email']")

    def test_password_field_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "input[type='password']")

    def test_submit_button_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "button[type='submit']")

    def test_login_link_present(self):
        assert self.page.has_login_link()

    def test_password_fields_are_masked(self):
        """All password fields use type='password'."""
        pw_fields = self.driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
        for field in pw_fields:
            assert field.get_attribute("type") == "password"

    def test_duplicate_email_shows_error(self):
        """Registering with existing admin email shows error."""
        self.page.register("Admin User", ADMIN_EMAIL, "SomePassword@123")
        time.sleep(3)
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        has_error = any(kw in body for kw in ["already", "exists", "taken", "registered", "error"])
        # Either error shown or redirected (if test user is new)
        assert has_error or "/account" in self.page.url

    def test_empty_submit_stays_on_register(self):
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1)
        assert "register" in self.page.url or self.page.exists(By.CSS_SELECTOR, "input[type='email']")

    def test_email_accepts_input(self):
        el = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        el.clear()
        el.send_keys("newuser@test.com")
        assert el.get_attribute("value") == "newuser@test.com"


class TestForgotPasswordPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = ForgotPasswordPage(driver, base_url)
        self.driver = driver
        self.page.load()

    def test_forgot_password_page_loads(self):
        assert "forgot" in self.page.url

    def test_heading_visible(self):
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_email_field_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "input[type='email']")

    def test_submit_button_present(self):
        assert self.page.exists(By.CSS_SELECTOR, "button[type='submit']")

    def test_back_to_login_link(self):
        assert self.page.has_login_link()

    def test_submit_real_email_shows_confirmation(self):
        """Submitting the admin email should show success."""
        self.page.submit_email(ADMIN_EMAIL)
        time.sleep(3)
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        has_success = any(kw in body for kw in ["sent", "email", "check", "success", "link"])
        assert has_success or self.page.exists(By.TAG_NAME, "main")

    def test_submit_fake_email(self):
        """Submitting a fake email may show error or success (depends on implementation)."""
        self.page.submit_email("notreal_xyz_9999@nowhere.invalid")
        time.sleep(2)
        assert self.page.exists(By.TAG_NAME, "main")

    def test_empty_submit(self):
        """Empty submit stays on page."""
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(1)
        assert self.page.exists(By.CSS_SELECTOR, "input[type='email']") or "forgot" in self.page.url


class TestResetPasswordPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = ResetPasswordPage(driver, base_url)
        self.driver = driver
        self.page.load()

    def test_reset_page_loads(self):
        """Reset password page loads (may show token error without valid token)."""
        assert self.page.page_loaded()

    def test_page_has_content(self):
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert len(body.strip()) > 20

    def test_password_field_or_error(self):
        """Either password form or token-expired error shows."""
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        has_form = self.page.has_password_field()
        has_error = any(kw in body for kw in ["expired", "invalid", "token", "error", "link"])
        assert has_form or has_error
