"""Auth POMs — Login, Register, ForgotPassword, ResetPassword"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


class LoginPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    EMAIL_INPUT   = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    SUBMIT_BTN    = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG     = (By.CSS_SELECTOR, "[class*='error'], [style*='red'], [role='alert']")
    REGISTER_LINK = (By.CSS_SELECTOR, "a[href*='register']")
    FORGOT_LINK   = (By.CSS_SELECTOR, "a[href*='forgot']")
    GOOGLE_BTN    = (By.XPATH, "//button[contains(text(),'Google')]")
    LOGO          = (By.TAG_NAME, "img")

    def load(self):
        return self.open("/auth/login")

    def login(self, email: str, password: str):
        self.type_text(*self.EMAIL_INPUT, email)
        self.type_text(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BTN)
        time.sleep(2)

    def has_error(self) -> bool:
        return self.exists(*self.ERROR_MSG, 4)

    def has_register_link(self) -> bool:
        return self.exists(*self.REGISTER_LINK)

    def has_forgot_link(self) -> bool:
        return self.exists(*self.FORGOT_LINK)

    def email_validation(self) -> bool:
        """Try submitting invalid email and check for browser validation."""
        self.type_text(*self.EMAIL_INPUT, "notanemail")
        self.click(*self.SUBMIT_BTN)
        time.sleep(0.5)
        email_el = self.find(*self.EMAIL_INPUT)
        return not email_el.get_property("validity")["valid"]


class RegisterPage(BasePage):
    HEADING          = (By.TAG_NAME, "h1")
    NAME_INPUT       = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name']")
    EMAIL_INPUT      = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT   = (By.CSS_SELECTOR, "input[type='password']")
    CONFIRM_PASS     = (By.CSS_SELECTOR, "input[name*='confirm'], input[placeholder*='confirm']")
    SUBMIT_BTN       = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG        = (By.CSS_SELECTOR, "[class*='error'], [style*='red'], [role='alert']")
    LOGIN_LINK       = (By.CSS_SELECTOR, "a[href*='login']")
    TERMS_CHECKBOX   = (By.CSS_SELECTOR, "input[type='checkbox']")

    def load(self):
        return self.open("/auth/register")

    def register(self, name: str, email: str, password: str):
        if self.exists(*self.NAME_INPUT):
            self.type_text(*self.NAME_INPUT, name)
        self.type_text(*self.EMAIL_INPUT, email)
        inputs = self.find_all(By.CSS_SELECTOR, "input[type='password']")
        for i, inp in enumerate(inputs):
            inp.clear()
            inp.send_keys(password)
        self.click(*self.SUBMIT_BTN)
        time.sleep(2)

    def has_error(self) -> bool:
        return self.exists(*self.ERROR_MSG, 4)

    def has_login_link(self) -> bool:
        return self.exists(*self.LOGIN_LINK)

    def password_field_count(self) -> int:
        return self.count(By.CSS_SELECTOR, "input[type='password']")


class ForgotPasswordPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    SUBMIT_BTN  = (By.CSS_SELECTOR, "button[type='submit']")
    SUCCESS_MSG = (By.XPATH, "//*[contains(text(),'sent') or contains(text(),'email') or contains(text(),'check')]")
    LOGIN_LINK  = (By.CSS_SELECTOR, "a[href*='login']")

    def load(self):
        return self.open("/auth/forgot-password")

    def submit_email(self, email: str):
        self.type_text(*self.EMAIL_INPUT, email)
        self.click(*self.SUBMIT_BTN)
        import time
        time.sleep(2)

    def has_success(self) -> bool:
        return self.exists(*self.SUCCESS_MSG, 5)

    def has_login_link(self) -> bool:
        return self.exists(*self.LOGIN_LINK)


class ResetPasswordPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    SUBMIT_BTN     = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG      = (By.CSS_SELECTOR, "[class*='error'], [role='alert']")
    LOGIN_LINK     = (By.CSS_SELECTOR, "a[href*='login']")

    def load(self):
        return self.open("/auth/reset-password")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 50

    def has_password_field(self) -> bool:
        return self.exists(*self.PASSWORD_INPUT)
