"""Account POMs — Dashboard, Orders, Profile, Wishlist, Points, Referrals"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


class AccountDashboard(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    WELCOME_MSG  = (By.XPATH, "//*[contains(text(),'Welcome') or contains(text(),'Hello') or contains(text(),'Account')]")
    NAV_LINKS    = (By.CSS_SELECTOR, "nav a, aside a, [class*='sidebar'] a")
    ORDERS_LINK  = (By.CSS_SELECTOR, "a[href*='orders']")
    PROFILE_LINK = (By.CSS_SELECTOR, "a[href*='profile']")
    WISHLIST_LINK= (By.CSS_SELECTOR, "a[href*='wishlist']")
    POINTS_LINK  = (By.CSS_SELECTOR, "a[href*='points']")
    LOGOUT_BTN   = (By.XPATH, "//button[contains(text(),'Logout') or contains(text(),'Sign Out')]")
    AUTH_REDIRECT= "/auth/login"

    def load(self):
        return self.open("/account")

    def is_logged_in(self) -> bool:
        return "/auth/login" not in self.url

    def has_nav_links(self) -> bool:
        return self.count(*self.NAV_LINKS) > 0

    def go_to_orders(self):
        self.click(*self.ORDERS_LINK)

    def go_to_profile(self):
        self.click(*self.PROFILE_LINK)

    def logout(self):
        if self.exists(*self.LOGOUT_BTN):
            self.click(*self.LOGOUT_BTN)
            time.sleep(2)


class OrdersPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ORDER_ROWS    = (By.CSS_SELECTOR, "tr, [class*='order-row'], a[href*='orders/']")
    EMPTY_STATE   = (By.XPATH, "//*[contains(text(),'No orders') or contains(text(),'empty')]")
    ORDER_DETAIL  = (By.CSS_SELECTOR, "a[href*='/account/orders/']")
    STATUS_BADGE  = (By.CSS_SELECTOR, ".badge-gold, [class*='badge'], [class*='status']")

    def load(self):
        return self.open("/account/orders")

    def has_orders(self) -> bool:
        return self.count(*self.ORDER_DETAIL) > 0

    def is_empty(self) -> bool:
        return self.exists(*self.EMPTY_STATE)

    def click_first_order(self):
        rows = self.find_all(*self.ORDER_DETAIL)
        if rows:
            self.scroll_to(rows[0])
            rows[0].click()

    def order_count(self) -> int:
        return self.count(*self.ORDER_DETAIL)


class OrderDetailPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ORDER_ID      = (By.XPATH, "//*[contains(text(),'Order') or contains(text(),'#')]")
    STATUS        = (By.CSS_SELECTOR, "[class*='status'], .badge-gold")
    ITEMS         = (By.CSS_SELECTOR, "img, [class*='item']")
    TOTAL         = (By.XPATH, "//*[contains(text(),'Total')]")
    TRACKING_INFO = (By.XPATH, "//*[contains(text(),'Track') or contains(text(),'tracking')]")

    def load(self, order_id: str):
        return self.open(f"/account/orders/{order_id}")

    def has_order_info(self) -> bool:
        return self.exists(*self.ORDER_ID)


class ProfilePage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    NAME_INPUT    = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name']")
    EMAIL_INPUT   = (By.CSS_SELECTOR, "input[type='email']")
    PHONE_INPUT   = (By.CSS_SELECTOR, "input[type='tel']")
    SAVE_BTN      = (By.CSS_SELECTOR, "button[type='submit'], button[class*='btn-gold']")
    SUCCESS_MSG   = (By.XPATH, "//*[contains(text(),'saved') or contains(text(),'updated') or contains(text(),'success')]")

    def load(self):
        return self.open("/account/profile")

    def has_form(self) -> bool:
        return self.exists(*self.EMAIL_INPUT) or self.exists(*self.NAME_INPUT)

    def has_save_button(self) -> bool:
        return self.exists(*self.SAVE_BTN)

    def update_name(self, name: str):
        if self.exists(*self.NAME_INPUT):
            el = self.find(*self.NAME_INPUT)
            el.clear()
            el.send_keys(name)
            if self.exists(*self.SAVE_BTN):
                self.click(*self.SAVE_BTN)
                time.sleep(1)


class WishlistPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ITEMS         = (By.CSS_SELECTOR, "[class*='product-card'], a[href*='/shop/']")
    EMPTY_STATE   = (By.XPATH, "//*[contains(text(),'empty') or contains(text(),'wishlist is empty')]")
    REMOVE_BTNS   = (By.CSS_SELECTOR, "button[aria-label*='remove'], button[class*='remove']")
    ADD_CART_BTNS = (By.CSS_SELECTOR, "button[class*='btn-gold'], button[class*='add-to-cart']")

    def load(self):
        return self.open("/account/wishlist")

    def is_empty(self) -> bool:
        return self.exists(*self.EMPTY_STATE) or self.count(*self.ITEMS) == 0

    def item_count(self) -> int:
        return self.count(*self.ITEMS)


class PointsPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    BALANCE_CARD   = (By.XPATH, "//*[contains(text(),'points') or contains(text(),'Points')]")
    HISTORY_TABLE  = (By.CSS_SELECTOR, "table, [class*='history']")
    HOW_IT_WORKS   = (By.XPATH, "//h2[contains(text(),'How') or contains(text(),'Works')]")
    DOLLAR_VALUE   = (By.XPATH, "//*[contains(text(),'$')]")
    EXPLAINER      = (By.XPATH, "//*[contains(text(),'100 points')]")

    def load(self):
        return self.open("/account/points")

    def has_balance_shown(self) -> bool:
        return self.exists(*self.BALANCE_CARD)

    def has_history(self) -> bool:
        return self.exists(*self.HISTORY_TABLE)

    def has_explainer(self) -> bool:
        return self.text_present("100 points") or self.text_present("$1")


class ReferralsPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    REFERRAL_CODE  = (By.CSS_SELECTOR, "[class*='referral-code'], code, [class*='code']")
    COPY_BTN       = (By.XPATH, "//button[contains(text(),'Copy')]")
    SHARE_BTNS     = (By.CSS_SELECTOR, "a[href*='whatsapp'], a[href*='twitter'], a[href*='facebook']")
    EARNINGS_INFO  = (By.XPATH, "//*[contains(text(),'earn') or contains(text(),'credit')]")

    def load(self):
        return self.open("/account/referrals")

    def has_referral_code(self) -> bool:
        return self.exists(*self.REFERRAL_CODE)

    def has_copy_button(self) -> bool:
        return self.exists(*self.COPY_BTN)

    def has_share_options(self) -> bool:
        return self.count(*self.SHARE_BTNS) > 0

    def click_copy(self):
        if self.exists(*self.COPY_BTN):
            self.click(*self.COPY_BTN)
