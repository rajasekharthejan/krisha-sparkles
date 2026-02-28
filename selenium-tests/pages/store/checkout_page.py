"""CheckoutPage POM — /checkout"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


class CheckoutPage(BasePage):
    HEADING          = (By.TAG_NAME, "h1")
    EMPTY_CART_MSG   = (By.XPATH, "//*[contains(text(),'empty') or contains(text(),'Empty')]")
    CART_ITEMS       = (By.CSS_SELECTOR, "img[alt]")
    COUPON_INPUT     = (By.CSS_SELECTOR, "input[placeholder*='coupon'], input[placeholder*='Coupon']")
    APPLY_COUPON_BTN = (By.XPATH, "//button[contains(text(),'Apply')]")
    COUPON_SUCCESS   = (By.CSS_SELECTOR, "[style*='#10b981'], [class*='success']")
    COUPON_ERROR     = (By.XPATH, "//*[contains(text(),'Invalid') or contains(text(),'expired')]")
    CHECKOUT_BTN     = (By.CSS_SELECTOR, "button.btn-gold, button[class*='btn-gold']")
    SUBTOTAL         = (By.XPATH, "//*[contains(text(),'Subtotal')]")
    TOTAL            = (By.XPATH, "//*[contains(text(),'Total')]")
    LOYALTY_TOGGLE   = (By.CSS_SELECTOR, "input[type='checkbox'], button[class*='toggle']")
    NEED_HELP_LINK   = (By.XPATH, "//button[contains(text(),'Need help')]")
    WHATSAPP_CHECK   = (By.CSS_SELECTOR, "input[type='checkbox']")
    LOCK_ICON        = (By.CSS_SELECTOR, "svg")
    STRIPE_LABEL     = (By.XPATH, "//*[contains(text(),'Stripe')]")
    SSL_LABEL        = (By.XPATH, "//*[contains(text(),'SSL')]")

    def load(self):
        return self.open("/checkout")

    def is_empty(self) -> bool:
        return self.exists(*self.EMPTY_CART_MSG) or self.count(*self.CART_ITEMS) == 0

    def apply_coupon(self, code: str):
        if self.exists(*self.COUPON_INPUT):
            self.type_text(*self.COUPON_INPUT, code)
            if self.exists(*self.APPLY_COUPON_BTN):
                self.click(*self.APPLY_COUPON_BTN)
                time.sleep(1)

    def coupon_applied(self) -> bool:
        return self.exists(*self.COUPON_SUCCESS, 3)

    def coupon_error(self) -> bool:
        return self.exists(*self.COUPON_ERROR, 3)

    def has_need_help(self) -> bool:
        return self.exists(*self.NEED_HELP_LINK)

    def has_ssl_info(self) -> bool:
        return self.exists(*self.SSL_LABEL) or self.exists(*self.STRIPE_LABEL)

    def has_loyalty_section(self) -> bool:
        return self.text_present("Loyalty") or self.text_present("Points")

    def click_checkout(self):
        btns = self.find_all(By.CSS_SELECTOR, "button")
        for btn in btns:
            if "checkout" in btn.text.lower() or "pay" in btn.text.lower():
                self.scroll_to(btn)
                btn.click()
                return

    def subtotal_text(self) -> str:
        try:
            return self.find(*self.SUBTOTAL).text
        except Exception:
            return ""


class OrderSuccessPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    ORDER_NUMBER   = (By.XPATH, "//*[contains(text(),'Order') and contains(text(),'#')]")
    CONTINUE_BTN   = (By.CSS_SELECTOR, "a[href='/shop'], a[href*='shop']")
    CONFETTI       = (By.CSS_SELECTOR, "[class*='confetti']")
    SUCCESS_ICON   = (By.CSS_SELECTOR, "[class*='success'], svg[class*='check']")
    RECOMMENDATIONS = (By.XPATH, "//h2[contains(text(),'Shop') or contains(text(),'Also')]")

    def load(self):
        return self.open("/order-success")

    def has_success_message(self) -> bool:
        body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        return any(kw in body_text for kw in ["success", "thank", "order", "confirmed"])

    def has_continue_button(self) -> bool:
        return self.exists(*self.CONTINUE_BTN)
