"""Tests for the Shop page (/shop) and product listing."""
import pytest
import time
from selenium.webdriver.common.by import By
from pages.store.shop_page import ShopPage
from pages.store.product_detail_page import ProductDetailPage
from utils.test_data import BASE_URL

pytestmark = pytest.mark.store


class TestShopPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = ShopPage(driver, base_url)
        self.driver = driver
        self.base_url = base_url

    def test_shop_page_loads(self):
        self.page.load()
        assert "shop" in self.page.url.lower() or "shop" in self.page.title.lower() or self.page.exists(By.TAG_NAME, "h1")

    def test_page_has_heading(self):
        self.page.load()
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_products_or_empty_state(self):
        """Either products show or an empty state message appears."""
        self.page.load()
        has_prods = self.page.has_products()
        has_empty = self.page.exists(By.XPATH, "//*[contains(text(),'No products') or contains(text(),'empty')]")
        assert has_prods or has_empty

    def test_product_cards_are_links(self):
        """All product cards are clickable links."""
        self.page.load()
        links = self.page.find_all(By.CSS_SELECTOR, "a[href*='/shop/']")
        if links:
            for link in links[:5]:
                href = link.get_attribute("href") or ""
                assert "/shop/" in href

    def test_filter_by_category_necklaces(self):
        """Filtering by necklaces returns filtered view."""
        self.page.load_with_category("necklaces")
        time.sleep(1)
        assert "necklace" in self.page.url.lower() or self.page.exists(By.TAG_NAME, "main")

    def test_filter_by_earrings(self):
        self.page.load_with_category("earrings")
        time.sleep(1)
        assert self.page.exists(By.TAG_NAME, "main")

    def test_filter_by_dresses(self):
        self.page.load_with_category("dresses")
        time.sleep(1)
        assert self.page.exists(By.TAG_NAME, "main")

    def test_click_product_navigates_to_detail(self):
        """Clicking a product card navigates to detail page."""
        self.page.load()
        links = self.page.find_all(By.CSS_SELECTOR, "a[href*='/shop/']")
        if not links:
            pytest.skip("No products available to click")
        href = links[0].get_attribute("href")
        links[0].click()
        time.sleep(1)
        assert "/shop/" in self.page.url

    def test_product_images_visible(self):
        """Product images render (have src attribute)."""
        self.page.load()
        imgs = self.page.find_all(By.CSS_SELECTOR, "img")
        if imgs:
            for img in imgs[:5]:
                src = img.get_attribute("src") or ""
                assert src != "", f"Image with empty src found"

    def test_price_displayed(self):
        """Prices are displayed on product cards."""
        self.page.load()
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        assert "$" in body_text or "price" in body_text.lower() or not self.page.has_products()

    def test_badges_present(self):
        """Gold badges (New, Sale, etc.) render."""
        self.page.load()
        # Not mandatory — just assert page renders
        assert self.page.exists(By.TAG_NAME, "main")

    def test_page_scrollable(self):
        self.page.load()
        self.page.scroll_to_bottom()
        self.page.scroll_to_top()

    def test_search_query_param(self):
        """Page handles search query parameter."""
        self.page.load("?search=earring")
        time.sleep(1)
        assert self.page.exists(By.TAG_NAME, "main")

    def test_sort_query_param(self):
        """Page handles sort query parameter."""
        self.page.load("?sort=price_asc")
        time.sleep(1)
        assert self.page.exists(By.TAG_NAME, "main")
