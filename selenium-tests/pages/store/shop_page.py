"""ShopPage POM — /shop"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class ShopPage(BasePage):
    HEADING         = (By.TAG_NAME, "h1")
    PRODUCT_CARDS   = (By.CSS_SELECTOR, ".product-card, [class*='product-card'], a[href*='/shop/']")
    SEARCH_INPUT    = (By.CSS_SELECTOR, "input[placeholder*='Search'], input[type='search']")
    FILTER_BTNS     = (By.CSS_SELECTOR, "button[class*='filter'], select[name*='sort'], select[name*='category']")
    SORT_SELECT     = (By.CSS_SELECTOR, "select")
    CATEGORY_FILTER = (By.CSS_SELECTOR, "a[href*='category='], button[data-category]")
    EMPTY_STATE     = (By.XPATH, "//p[contains(text(),'No products')]")
    LOAD_MORE       = (By.CSS_SELECTOR, "button[class*='load-more'], button[aria-label*='more']")
    GRID_CONTAINER  = (By.CSS_SELECTOR, "[class*='grid'], [class*='products-grid']")
    BADGE_GOLD      = (By.CSS_SELECTOR, ".badge-gold, [class*='badge-gold']")

    def load(self, query: str = ""):
        path = f"/shop{query}"
        return self.open(path)

    def load_with_category(self, category: str):
        return self.open(f"/shop?category={category}")

    def product_count(self) -> int:
        return self.count(*self.PRODUCT_CARDS)

    def has_products(self) -> bool:
        return self.product_count() > 0

    def click_first_product(self):
        cards = self.find_all(*self.PRODUCT_CARDS)
        if cards:
            self.scroll_to(cards[0])
            cards[0].click()

    def get_first_product_href(self) -> str:
        cards = self.find_all(*self.PRODUCT_CARDS)
        if cards:
            return cards[0].get_attribute("href") or ""
        return ""

    def search(self, query: str):
        if self.exists(*self.SEARCH_INPUT):
            self.type_text(*self.SEARCH_INPUT, query)
            import time
            time.sleep(1)

    def filter_by_category(self, category: str):
        links = self.find_all(*self.CATEGORY_FILTER)
        for link in links:
            if category.lower() in (link.text.lower() + (link.get_attribute("href") or "")):
                self.scroll_to(link)
                link.click()
                break

    def has_badges(self) -> bool:
        return self.count(*self.BADGE_GOLD) > 0

    def all_product_names(self) -> list:
        cards = self.find_all(*self.PRODUCT_CARDS)
        return [c.text.split("\n")[0] for c in cards if c.text.strip()]
