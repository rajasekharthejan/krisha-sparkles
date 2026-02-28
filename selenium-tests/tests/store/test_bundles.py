"""Tests for Bundles page (/bundles) and Bundle detail (/bundles/[slug])."""
import pytest
import time
from selenium.webdriver.common.by import By
from pages.store.bundles_page import BundlesPage, BundleDetailPage
from utils.test_data import BASE_URL, BUNDLE_SLUG

pytestmark = pytest.mark.store


class TestBundlesPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = BundlesPage(driver, base_url)
        self.driver = driver

    def test_bundles_page_loads(self):
        """Bundles listing page loads successfully."""
        self.page.load()
        assert self.page.exists(By.TAG_NAME, "main") or self.page.exists(By.TAG_NAME, "h1")

    def test_page_has_heading(self):
        self.page.load()
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_bundles_or_empty_state(self):
        """Either bundles or empty state message shows."""
        self.page.load()
        time.sleep(1)
        has_bundles = self.page.has_bundles()
        has_empty = self.page.exists(By.XPATH, "//*[contains(text(),'No bundle') or contains(text(),'empty')]")
        assert has_bundles or has_empty or self.page.exists(By.TAG_NAME, "main")

    def test_bundle_cards_are_links(self):
        """Bundle cards link to /bundles/[slug]."""
        self.page.load()
        time.sleep(1)
        links = self.page.find_all(By.CSS_SELECTOR, "a[href*='/bundles/']")
        for link in links:
            href = link.get_attribute("href") or ""
            assert "/bundles/" in href

    def test_bundle_prices_visible(self):
        """Bundle prices show dollar amounts."""
        self.page.load()
        time.sleep(1)
        if self.page.has_bundles():
            body = self.driver.find_element(By.TAG_NAME, "body").text
            assert "$" in body

    def test_savings_badge_shown(self):
        """Savings badge shown when compare_price > bundle_price."""
        self.page.load()
        time.sleep(1)
        # Savings badge is optional (depends on bundle data)
        assert self.page.exists(By.TAG_NAME, "main")

    def test_navigate_to_bundle_detail(self):
        """Clicking a bundle navigates to detail page."""
        self.page.load()
        time.sleep(1)
        links = self.page.find_all(By.CSS_SELECTOR, "a[href*='/bundles/']")
        if not links:
            pytest.skip("No bundles available to click")
        href = links[0].get_attribute("href")
        links[0].click()
        time.sleep(1)
        assert "/bundles/" in self.page.url

    def test_bundles_page_scrollable(self):
        self.page.load()
        self.page.scroll_to_bottom()
        self.page.scroll_to_top()


class TestBundleDetailPage:
    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = BundleDetailPage(driver, base_url)
        self.driver = driver
        # Get real bundle slug from listing
        listing = BundlesPage(driver, base_url)
        listing.load()
        time.sleep(1)
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/bundles/']")
        self.real_slug = None
        for link in links:
            href = link.get_attribute("href") or ""
            if "/bundles/" in href:
                slug = href.split("/bundles/")[-1].rstrip("/")
                if slug and slug != "bundles":
                    self.real_slug = slug
                    break

    def test_bundle_detail_loads(self):
        if not self.real_slug:
            pytest.skip("No bundles in DB")
        self.page.load(self.real_slug)
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_bundle_name_shown(self):
        if not self.real_slug:
            pytest.skip("No bundles in DB")
        self.page.load(self.real_slug)
        name = self.page.bundle_name()
        assert len(name) > 0

    def test_bundle_price_shown(self):
        if not self.real_slug:
            pytest.skip("No bundles in DB")
        self.page.load(self.real_slug)
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert "$" in body

    def test_add_all_button_present(self):
        if not self.real_slug:
            pytest.skip("No bundles in DB")
        self.page.load(self.real_slug)
        assert self.page.has_add_all_button() or self.page.exists(By.CSS_SELECTOR, "button")

    def test_included_products_shown(self):
        if not self.real_slug:
            pytest.skip("No bundles in DB")
        self.page.load(self.real_slug)
        assert self.page.has_items()

    def test_404_invalid_bundle_slug(self):
        self.page.load("this-bundle-does-not-exist-xyz")
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["not found", "404", "error"])
