"""HomePage POM — / """
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class HomePage(BasePage):
    # Locators
    HERO_SECTION     = (By.CSS_SELECTOR, "section")
    HERO_HEADING     = (By.CSS_SELECTOR, "h1")
    SHOP_NOW_BTN     = (By.CSS_SELECTOR, "a[href='/shop']")
    MARQUEE_TICKER   = (By.CSS_SELECTOR, ".marquee-track, [class*='marquee']")
    CATEGORY_SECTION = (By.CSS_SELECTOR, "[class*='CategoryGrid'], [data-testid='category-grid']")
    FEATURED_HEADING = (By.XPATH, "//h2[contains(text(),'Featured')]")
    PRODUCT_CARDS    = (By.CSS_SELECTOR, ".product-card, [class*='product-card']")
    TRUST_BADGES     = (By.CSS_SELECTOR, "[class*='trust'], [class*='badge-row']")
    INSTAGRAM_SEC    = (By.XPATH, "//h2[contains(text(),'Instagram')]")
    TIKTOK_SEC       = (By.XPATH, "//h2[contains(text(),'TikTok')]")
    GIFT_SETS_SEC    = (By.XPATH, "//h2[contains(text(),'Gift')]")
    NEWSLETTER_SEC   = (By.CSS_SELECTOR, "input[type='email']")
    FOOTER           = (By.TAG_NAME, "footer")
    NAVBAR           = (By.TAG_NAME, "nav")
    CART_ICON        = (By.CSS_SELECTOR, "button[aria-label*='cart'], button[aria-label*='Cart']")

    def load(self):
        return self.open("/")

    def hero_text(self) -> str:
        try:
            return self.find(*self.HERO_HEADING).text
        except Exception:
            return ""

    def click_shop_now(self):
        self.click(*self.SHOP_NOW_BTN)

    def has_marquee(self) -> bool:
        return self.is_visible(*self.MARQUEE_TICKER)

    def has_categories(self) -> bool:
        # Categories is a separate component — check at least one category link
        return self.count(By.CSS_SELECTOR, "a[href*='/shop?category']") > 0

    def has_featured_products(self) -> bool:
        return self.count(*self.PRODUCT_CARDS) > 0 or self.exists(*self.FEATURED_HEADING)

    def has_instagram_section(self) -> bool:
        return self.exists(*self.INSTAGRAM_SEC)

    def has_tiktok_section(self) -> bool:
        return self.exists(*self.TIKTOK_SEC)

    def has_gift_sets_section(self) -> bool:
        return self.exists(*self.GIFT_SETS_SEC)

    def has_newsletter(self) -> bool:
        return self.exists(*self.NEWSLETTER_SEC)

    def subscribe_newsletter(self, email: str):
        self.scroll_to_bottom()
        field = self.wait_visible(*self.NEWSLETTER_SEC)
        field.clear()
        field.send_keys(email)
        submit_btns = self.find_all(By.CSS_SELECTOR, "button[type='submit']")
        for btn in submit_btns:
            if "subscribe" in btn.text.lower() or "join" in btn.text.lower() or btn.is_displayed():
                btn.click()
                break

    def open_cart(self):
        self.click(*self.CART_ICON)

    def cart_count(self) -> int:
        try:
            count_el = self.find(By.CSS_SELECTOR, "[class*='cart-count'], span[class*='badge']")
            return int(count_el.text.strip() or "0")
        except Exception:
            return 0
