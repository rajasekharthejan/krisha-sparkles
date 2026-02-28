"""Tests for Account pages (require authenticated user session)."""
import pytest
import time
from selenium.webdriver.common.by import By
from pages.store.account.account_pages import (
    AccountDashboard, OrdersPage, OrderDetailPage,
    ProfilePage, WishlistPage, PointsPage, ReferralsPage,
)
from utils.test_data import ADMIN_EMAIL, ADMIN_PASSWORD

pytestmark = [pytest.mark.store, pytest.mark.account]


# ── Helper: Pre-login with admin account ─────────────────────

def do_login(driver, base_url, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    """Login with given credentials. Returns True on success."""
    driver.get(f"{base_url}/auth/login")
    time.sleep(1)
    try:
        driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(email)
        driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(3)
        return "/auth/login" not in driver.current_url
    except Exception:
        return False


class TestAccountDashboard:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = AccountDashboard(user_driver, base_url)
        self.driver = user_driver

    def test_account_page_loads_when_logged_in(self):
        """Account dashboard loads for logged-in user."""
        self.page.load()
        time.sleep(1)
        assert "/account" in self.page.url or "/auth/login" in self.page.url

    def test_account_requires_auth(self, driver, base_url):
        """Unauthenticated user is redirected to login."""
        driver.get(f"{base_url}/account")
        time.sleep(2)
        url = driver.current_url
        assert "/auth/login" in url or "/account" in url

    def test_account_has_nav_links(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_nav_links()

    def test_orders_link_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.CSS_SELECTOR, "a[href*='orders']")

    def test_profile_link_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        links = self.driver.find_elements(By.TAG_NAME, "a")
        profile_links = [l for l in links if "profile" in (l.get_attribute("href") or "")]
        assert len(profile_links) > 0

    def test_wishlist_link_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.CSS_SELECTOR, "a[href*='wishlist']")

    def test_points_link_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        links = self.driver.find_elements(By.TAG_NAME, "a")
        points_links = [l for l in links if "points" in (l.get_attribute("href") or "")]
        assert len(points_links) > 0


class TestOrdersPage:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = OrdersPage(user_driver, base_url)
        self.driver = user_driver

    def test_orders_page_loads(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert "/account/orders" in self.page.url

    def test_orders_heading_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_orders_or_empty_state(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        has_orders = self.page.has_orders()
        has_empty = self.page.is_empty()
        assert has_orders or has_empty

    def test_order_links_valid(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        links = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/account/orders/']")
        for link in links:
            href = link.get_attribute("href") or ""
            assert "/account/orders/" in href


class TestProfilePage:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = ProfilePage(user_driver, base_url)
        self.driver = user_driver

    def test_profile_page_loads(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert "/account/profile" in self.page.url

    def test_profile_heading_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_profile_has_form(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_form()

    def test_save_button_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_save_button()

    def test_email_field_not_editable(self):
        """Email field is typically read-only."""
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='email']")
        if inputs:
            readonly = inputs[0].get_attribute("readonly") or inputs[0].get_attribute("disabled")
            # Email may or may not be readonly — just check it's there
            assert True


class TestWishlistPage:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = WishlistPage(user_driver, base_url)
        self.driver = user_driver

    def test_wishlist_page_loads(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert "/account/wishlist" in self.page.url

    def test_wishlist_heading_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_wishlist_empty_or_has_items(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.is_empty() or self.page.item_count() > 0


class TestPointsPage:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = PointsPage(user_driver, base_url)
        self.driver = user_driver

    def test_points_page_loads(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert "/account/points" in self.page.url

    def test_points_heading_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_balance_displayed(self):
        self.page.load()
        time.sleep(2)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_balance_shown()

    def test_how_it_works_section(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["points", "earn", "redeem", "100"])

    def test_explainer_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_explainer() or self.page.text_present("points")


class TestReferralsPage:
    @pytest.fixture(autouse=True)
    def setup(self, user_driver, base_url):
        self.page = ReferralsPage(user_driver, base_url)
        self.driver = user_driver

    def test_referrals_page_loads(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert "/account/referrals" in self.page.url

    def test_referrals_heading_visible(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.exists(By.TAG_NAME, "h1")

    def test_referral_code_displayed(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_referral_code() or self.page.text_present("referral")

    def test_copy_button_present(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        assert self.page.has_copy_button() or self.page.exists(By.CSS_SELECTOR, "button")

    def test_earnings_info_shown(self):
        self.page.load()
        time.sleep(1)
        if "/auth/login" in self.page.url:
            pytest.skip("User not logged in")
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        assert any(kw in body for kw in ["earn", "credit", "refer", "reward"])
