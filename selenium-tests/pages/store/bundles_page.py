"""BundlesPage POM — /bundles and /bundles/[slug]"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class BundlesPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    BUNDLE_CARDS  = (By.CSS_SELECTOR, "a[href*='/bundles/']")
    SAVINGS_BADGE = (By.XPATH, "//div[contains(text(),'Save')]")
    EMPTY_STATE   = (By.XPATH, "//p[contains(text(),'No bundles')]")
    PRICE_ELS     = (By.XPATH, "//*[contains(text(),'$')]")

    def load(self):
        return self.open("/bundles")

    def bundle_count(self) -> int:
        return self.count(*self.BUNDLE_CARDS)

    def has_bundles(self) -> bool:
        return self.bundle_count() > 0

    def click_first_bundle(self):
        cards = self.find_all(*self.BUNDLE_CARDS)
        if cards:
            self.scroll_to(cards[0])
            cards[0].click()

    def get_bundle_hrefs(self) -> list:
        return [c.get_attribute("href") for c in self.find_all(*self.BUNDLE_CARDS)]

    def has_savings_badge(self) -> bool:
        return self.exists(*self.SAVINGS_BADGE)

    def has_prices(self) -> bool:
        return self.count(*self.PRICE_ELS) > 0


class BundleDetailPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    BUNDLE_PRICE  = (By.XPATH, "//span[contains(text(),'$')]")
    ITEMS_LIST    = (By.CSS_SELECTOR, "img, [class*='product']")
    ADD_ALL_BTN   = (By.CSS_SELECTOR, "button[class*='btn-gold'], button[class*='add-all']")
    DESCRIPTION   = (By.CSS_SELECTOR, "p")
    BACK_LINK     = (By.CSS_SELECTOR, "a[href='/bundles']")
    SAVINGS_INFO  = (By.XPATH, "//*[contains(text(),'Save') or contains(text(),'save')]")

    def load(self, slug: str):
        return self.open(f"/bundles/{slug}")

    def bundle_name(self) -> str:
        try:
            return self.find(*self.HEADING).text.strip()
        except Exception:
            return ""

    def has_price(self) -> bool:
        return self.exists(*self.BUNDLE_PRICE)

    def has_items(self) -> bool:
        return self.count(*self.ITEMS_LIST) > 0

    def has_add_all_button(self) -> bool:
        return self.exists(*self.ADD_ALL_BTN)

    def click_add_all(self):
        if self.exists(*self.ADD_ALL_BTN):
            self.click(*self.ADD_ALL_BTN)

    def has_back_link(self) -> bool:
        return self.exists(*self.BACK_LINK)
