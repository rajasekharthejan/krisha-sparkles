"""ProductDetailPage POM — /shop/[slug]"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage


class ProductDetailPage(BasePage):
    PRODUCT_NAME      = (By.TAG_NAME, "h1")
    PRICE             = (By.CSS_SELECTOR, "[class*='price'], [class*='gold']")
    ADD_TO_CART_BTN   = (By.CSS_SELECTOR, "button[class*='btn-gold'], button[class*='add-to-cart']")
    SOLD_OUT_BADGE    = (By.XPATH, "//span[contains(text(),'Sold Out') or contains(text(),'Out of Stock')]")
    BACK_IN_STOCK_BTN = (By.CSS_SELECTOR, "button[class*='back-in-stock'], input[placeholder*='email']")
    QUANTITY_BTN      = (By.CSS_SELECTOR, "button[aria-label*='quantity'], button[aria-label*='+'], button[aria-label*='-']")
    DESCRIPTION       = (By.CSS_SELECTOR, "[class*='description'], [class*='product-desc']")
    IMAGES            = (By.CSS_SELECTOR, "img[alt], [class*='product-image']")
    BREADCRUMB        = (By.CSS_SELECTOR, "[class*='breadcrumb'], nav[aria-label*='breadcrumb']")
    RECOMMENDATIONS   = (By.XPATH, "//h2[contains(text(),'Also') or contains(text(),'Recommend')]")
    WISHLIST_BTN      = (By.CSS_SELECTOR, "button[aria-label*='wishlist'], button[aria-label*='Wishlist']")
    ASK_BTN           = (By.XPATH, "//button[contains(text(),'Ask')]")
    CATEGORY_TAG      = (By.CSS_SELECTOR, "[class*='category'], [class*='badge-gold']")
    SHARE_BTN         = (By.CSS_SELECTOR, "button[aria-label*='share'], button[class*='share']")

    def load(self, slug: str):
        return self.open(f"/shop/{slug}")

    def product_name(self) -> str:
        try:
            return self.find(*self.PRODUCT_NAME).text.strip()
        except Exception:
            return ""

    def is_sold_out(self) -> bool:
        return self.exists(*self.SOLD_OUT_BADGE)

    def is_in_stock(self) -> bool:
        return self.exists(*self.ADD_TO_CART_BTN)

    def click_add_to_cart(self):
        self.click(*self.ADD_TO_CART_BTN)

    def has_images(self) -> bool:
        return self.count(*self.IMAGES) > 0

    def has_price(self) -> bool:
        price_els = self.find_all(By.CSS_SELECTOR, "*")
        for el in price_els:
            if "$" in el.text:
                return True
        return False

    def has_recommendations(self) -> bool:
        return self.exists(*self.RECOMMENDATIONS)

    def has_ask_question_btn(self) -> bool:
        return self.exists(*self.ASK_BTN)

    def click_wishlist(self):
        if self.exists(*self.WISHLIST_BTN):
            self.click(*self.WISHLIST_BTN)

    def get_image_count(self) -> int:
        return self.count(*self.IMAGES)
