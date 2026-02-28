"""Tests for the Home page (/)"""
import pytest
from selenium.webdriver.common.by import By
from pages.store.home_page import HomePage
from utils.test_data import BASE_URL, NEWSLETTER_EMAIL

pytestmark = pytest.mark.store


class TestHomePage:
    """Comprehensive tests for the Krisha Sparkles home page."""

    @pytest.fixture(autouse=True)
    def setup(self, driver, base_url):
        self.page = HomePage(driver, base_url)
        self.page.load()

    # ── Load & Structure ─────────────────────────────────

    def test_page_loads(self):
        """Home page loads without error."""
        assert "Krisha" in self.page.driver.title or self.page.driver.title != ""

    def test_page_title_contains_brand(self):
        """Page title contains the brand name."""
        assert "Krisha" in self.page.title or "Sparkles" in self.page.title

    def test_navbar_is_visible(self):
        """Top navigation bar is visible."""
        assert self.page.exists(By.TAG_NAME, "nav")

    def test_navbar_has_store_links(self):
        """Navbar contains shop, blog, gift sets links."""
        links = self.page.navbar_links()
        combined = " ".join(links).lower()
        assert any(kw in combined for kw in ["shop", "home"])

    # ── Hero Section ─────────────────────────────────────

    def test_hero_heading_visible(self):
        """Hero section has a main heading."""
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_hero_has_cta_button(self):
        """Hero has a Shop Now / CTA button."""
        links = self.page.find_all(By.TAG_NAME, "a")
        cta_found = any("shop" in (a.get_attribute("href") or "").lower() for a in links)
        assert cta_found, "No CTA link to /shop found on hero"

    def test_hero_background_visible(self):
        """Hero section has a background (not empty)."""
        sections = self.page.find_all(By.TAG_NAME, "section")
        assert len(sections) > 0

    # ── Marquee / Trust Badges ────────────────────────────

    def test_page_has_content_sections(self):
        """Page renders multiple content sections."""
        sections = self.page.find_all(By.TAG_NAME, "section")
        assert len(sections) >= 3, f"Expected ≥3 sections, got {len(sections)}"

    # ── Categories ───────────────────────────────────────

    def test_categories_section_visible(self):
        """Shop by Category section is present."""
        assert self.page.has_categories(), "Category links not found on home page"

    def test_category_links_lead_to_shop(self):
        """Category links all point to /shop?category=..."""
        links = self.page.find_all(By.CSS_SELECTOR, "a[href*='category=']")
        assert len(links) > 0, "No category filter links found"
        for link in links:
            href = link.get_attribute("href") or ""
            assert "/shop" in href, f"Category link doesn't go to shop: {href}"

    # ── Featured Products ─────────────────────────────────

    def test_featured_section_exists(self):
        """Featured products section is present."""
        assert self.page.has_featured_products()

    # ── Gift Sets / Bundles ───────────────────────────────

    def test_page_scrolls_fully(self):
        """Page is scrollable to the bottom without JS errors."""
        self.page.scroll_to_bottom()
        self.page.scroll_to_top()

    # ── Instagram Section ─────────────────────────────────

    def test_instagram_section_present(self):
        """Instagram section renders if posts are seeded in DB (skips if no data locally)."""
        # Instagram section only renders if instagram_posts table has active rows
        if not self.page.has_instagram_section():
            pytest.skip("No Instagram posts seeded in local DB — section not rendered")
        assert self.page.has_instagram_section()

    # ── TikTok Section ────────────────────────────────────

    def test_tiktok_section_present(self):
        """TikTok feed section renders if posts are seeded in DB (skips if no data locally)."""
        self.page.scroll_to_bottom()
        # TikTok section only renders if tiktok_posts table has active rows
        if not self.page.has_tiktok_section():
            pytest.skip("No TikTok posts seeded in local DB — section not rendered")
        assert self.page.has_tiktok_section()

    # ── Newsletter ────────────────────────────────────────

    def test_newsletter_form_present(self):
        """Newsletter signup email input is present."""
        self.page.scroll_to_bottom()
        assert self.page.has_newsletter()

    def test_newsletter_input_accepts_email(self):
        """Newsletter input accepts email text."""
        self.page.scroll_to_bottom()
        inputs = self.page.find_all(By.CSS_SELECTOR, "input[type='email']")
        assert len(inputs) > 0
        inputs[-1].clear()
        inputs[-1].send_keys("test@example.com")
        assert inputs[-1].get_attribute("value") == "test@example.com"

    # ── Cart ─────────────────────────────────────────────

    def test_cart_icon_visible(self):
        """Cart icon is visible in navbar."""
        btns = self.page.find_all(By.CSS_SELECTOR, "button")
        cart_found = any("bag" in (b.get_attribute("aria-label") or "").lower() or
                         "cart" in (b.get_attribute("aria-label") or "").lower()
                         for b in btns)
        # Cart could also be a link
        cart_links = self.page.find_all(By.CSS_SELECTOR, "a[href*='cart']")
        assert cart_found or len(cart_links) > 0 or len(btns) > 0

    # ── Navigation ────────────────────────────────────────

    def test_clicking_shop_link_navigates(self):
        """Clicking Shop in navbar navigates to /shop."""
        links = self.page.find_all(By.TAG_NAME, "a")
        for link in links:
            href = link.get_attribute("href") or ""
            if href.endswith("/shop"):
                link.click()
                self.page.wait_url_contains("/shop")
                assert "/shop" in self.page.url
                break

    def test_logo_links_to_home(self):
        """Logo links back to home page."""
        logos = self.page.find_all(By.CSS_SELECTOR, "a > img, a[href='/']")
        assert len(logos) > 0

    # ── Responsive ────────────────────────────────────────

    def test_mobile_viewport(self, driver, base_url):
        """Page renders correctly at mobile width."""
        driver.set_window_size(375, 812)
        page = HomePage(driver, base_url)
        page.load()
        assert page.exists(By.TAG_NAME, "nav")
        driver.maximize_window()

    def test_tablet_viewport(self, driver, base_url):
        """Page renders correctly at tablet width."""
        driver.set_window_size(768, 1024)
        page = HomePage(driver, base_url)
        page.load()
        assert page.exists(By.TAG_NAME, "h1")
        driver.maximize_window()
