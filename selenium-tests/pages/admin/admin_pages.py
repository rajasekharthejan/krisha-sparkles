"""
admin_pages.py — Page Object Models for all Admin panel pages.
All admin POMs in one file for conciseness.
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


# ── Admin Login ──────────────────────────────────────────────

class AdminLoginPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    EMAIL_INPUT    = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    SUBMIT_BTN     = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG      = (By.CSS_SELECTOR, "[class*='error'], [style*='red'], [role='alert']")
    LOGO           = (By.TAG_NAME, "img")

    def load(self):
        return self.open("/admin/login")

    def login(self, email: str, password: str):
        self.type_text(*self.EMAIL_INPUT, email)
        self.type_text(*self.PASSWORD_INPUT, password)
        self.click(*self.SUBMIT_BTN)
        time.sleep(2)

    def has_error(self) -> bool:
        return self.exists(*self.ERROR_MSG, 4)

    def is_on_login_page(self) -> bool:
        return "/admin/login" in self.url


# ── Admin Dashboard ──────────────────────────────────────────

class AdminDashboard(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    SIDEBAR      = (By.CSS_SELECTOR, "aside, [class*='sidebar']")
    NAV_LINKS    = (By.CSS_SELECTOR, "aside a, [class*='sidebar'] a")
    STAT_CARDS   = (By.CSS_SELECTOR, "[class*='stat'], [class*='card'], [class*='metric']")
    ORDERS_LINK  = (By.CSS_SELECTOR, "a[href*='orders']")
    PRODUCTS_LINK= (By.CSS_SELECTOR, "a[href*='products']")
    LOGO         = (By.CSS_SELECTOR, "img[alt]")

    def load(self):
        return self.open("/admin")

    def is_on_dashboard(self) -> bool:
        return "/admin" in self.url and "login" not in self.url

    def has_sidebar(self) -> bool:
        return self.exists(*self.SIDEBAR)

    def nav_link_count(self) -> int:
        return self.count(*self.NAV_LINKS)

    def click_sidebar_link(self, text: str):
        links = self.find_all(By.CSS_SELECTOR, "aside a, [class*='sidebar'] a")
        for link in links:
            if text.lower() in link.text.lower():
                self.scroll_to(link)
                link.click()
                time.sleep(1)
                return
        raise Exception(f"Sidebar link '{text}' not found")


# ── Admin Products ───────────────────────────────────────────

class AdminProductsPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ADD_BTN       = (By.CSS_SELECTOR, "a[href*='products/new'], button[class*='btn-gold']")
    TABLE         = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS          = (By.CSS_SELECTOR, "tbody tr, [class*='table-row']")
    SEARCH_INPUT  = (By.CSS_SELECTOR, "input[placeholder*='search'], input[type='search']")
    EDIT_BTNS     = (By.CSS_SELECTOR, "a[href*='edit'], button[aria-label*='edit']")
    DELETE_BTNS   = (By.CSS_SELECTOR, "button[aria-label*='delete'], button[class*='delete']")
    BULK_UPLOAD   = (By.CSS_SELECTOR, "a[href*='bulk']")
    STATUS_TOGGLE = (By.CSS_SELECTOR, "input[type='checkbox']")

    def load(self):
        return self.open("/admin/products")

    def product_count(self) -> int:
        return self.count(*self.ROWS)

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)

    def has_add_button(self) -> bool:
        return self.exists(*self.ADD_BTN)

    def click_add_product(self):
        self.click(*self.ADD_BTN)

    def search_product(self, query: str):
        if self.exists(*self.SEARCH_INPUT):
            self.type_text(*self.SEARCH_INPUT, query)
            time.sleep(1)


class AdminNewProductPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    NAME_INPUT    = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name']")
    PRICE_INPUT   = (By.CSS_SELECTOR, "input[name='price'], input[type='number']")
    CATEGORY_SEL  = (By.CSS_SELECTOR, "select[name='category_id'], select")
    DESCRIPTION   = (By.CSS_SELECTOR, "textarea[name='description'], textarea")
    STOCK_INPUT   = (By.CSS_SELECTOR, "input[name='stock_quantity']")
    SUBMIT_BTN    = (By.CSS_SELECTOR, "button[type='submit']")
    FEATURED_CHK  = (By.CSS_SELECTOR, "input[name='featured'], input[type='checkbox']")
    IMAGE_UPLOAD  = (By.CSS_SELECTOR, "input[type='file']")

    def load(self):
        return self.open("/admin/products/new")

    def has_form(self) -> bool:
        return self.exists(*self.NAME_INPUT) and self.exists(*self.PRICE_INPUT)

    def has_submit(self) -> bool:
        return self.exists(*self.SUBMIT_BTN)


class AdminEditProductPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    NAME_INPUT    = (By.CSS_SELECTOR, "input[name='name']")
    SAVE_BTN      = (By.CSS_SELECTOR, "button[type='submit'], button[class*='btn-gold']")

    def load(self, product_id: str):
        return self.open(f"/admin/products/{product_id}/edit")

    def has_form(self) -> bool:
        return self.exists(*self.NAME_INPUT)


class AdminBulkUploadPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    FILE_INPUT= (By.CSS_SELECTOR, "input[type='file']")
    TEMPLATE  = (By.CSS_SELECTOR, "a[download], button[class*='download']")

    def load(self):
        return self.open("/admin/products/bulk-upload")

    def has_upload(self) -> bool:
        return self.exists(*self.FILE_INPUT)


class AdminBulkPricePage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    PERCENT_INPUT = (By.CSS_SELECTOR, "input[type='number']")
    APPLY_BTN     = (By.CSS_SELECTOR, "button[type='submit'], button[class*='btn-gold']")

    def load(self):
        return self.open("/admin/products/bulk-price")

    def has_form(self) -> bool:
        return self.exists(*self.PERCENT_INPUT) or self.exists(*self.APPLY_BTN)


# ── Admin Orders ─────────────────────────────────────────────

class AdminOrdersPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    TABLE        = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS         = (By.CSS_SELECTOR, "tbody tr")
    STATUS_FILTER= (By.CSS_SELECTOR, "select, button[class*='filter']")
    DETAIL_LINKS = (By.CSS_SELECTOR, "a[href*='/admin/orders/']")
    EXPORT_BTN   = (By.XPATH, "//button[contains(text(),'Export') or contains(text(),'CSV')]")

    def load(self):
        return self.open("/admin/orders")

    def order_count(self) -> int:
        return self.count(*self.ROWS)

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)

    def click_first_order(self):
        links = self.find_all(*self.DETAIL_LINKS)
        if links:
            self.scroll_to(links[0])
            links[0].click()


class AdminOrderDetailPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ORDER_INFO    = (By.XPATH, "//*[contains(text(),'Order') or contains(text(),'#')]")
    STATUS_SELECT = (By.CSS_SELECTOR, "select, button[class*='status']")
    CUSTOMER_INFO = (By.XPATH, "//*[contains(text(),'Customer') or contains(text(),'Email')]")
    ITEMS_TABLE   = (By.CSS_SELECTOR, "table, [class*='items']")
    UPDATE_BTN    = (By.CSS_SELECTOR, "button[class*='btn-gold'], button[type='submit']")
    TRACKING_INPUT= (By.CSS_SELECTOR, "input[placeholder*='tracking'], input[name*='tracking']")

    def load(self, order_id: str):
        return self.open(f"/admin/orders/{order_id}")

    def has_order_info(self) -> bool:
        return self.exists(*self.ORDER_INFO)


# ── Admin Inventory ───────────────────────────────────────────

class AdminInventoryPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    TABLE         = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS          = (By.CSS_SELECTOR, "tbody tr")
    STOCK_INPUTS  = (By.CSS_SELECTOR, "input[type='number']")
    SAVE_BTNS     = (By.CSS_SELECTOR, "button[class*='btn-gold']")
    WAITLIST_COL  = (By.XPATH, "//th[contains(text(),'Waitlist')]")
    LOW_STOCK     = (By.XPATH, "//*[contains(text(),'Low Stock') or contains(text(),'low-stock')]")

    def load(self):
        return self.open("/admin/inventory")

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)

    def row_count(self) -> int:
        return self.count(*self.ROWS)

    def has_waitlist_column(self) -> bool:
        return self.exists(*self.WAITLIST_COL)


# ── Admin Promotions ──────────────────────────────────────────

class AdminPromotionsPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    ADD_BTN       = (By.CSS_SELECTOR, "button[class*='btn-gold']")
    COUPON_TABLE  = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS          = (By.CSS_SELECTOR, "tbody tr")
    MODAL         = (By.CSS_SELECTOR, "[class*='modal'], [role='dialog']")
    CODE_INPUT    = (By.CSS_SELECTOR, "input[name='code'], input[placeholder*='code']")
    DISCOUNT_INPUT= (By.CSS_SELECTOR, "input[type='number']")
    SAVE_BTN      = (By.XPATH, "//button[contains(text(),'Save') or contains(text(),'Create')]")

    def load(self):
        return self.open("/admin/promotions")

    def has_table(self) -> bool:
        return self.exists(*self.COUPON_TABLE)

    def click_add(self):
        self.click(*self.ADD_BTN)
        time.sleep(0.5)

    def modal_open(self) -> bool:
        return self.exists(*self.MODAL, 3)


# ── Admin Reviews ─────────────────────────────────────────────

class AdminReviewsPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    TABLE        = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS         = (By.CSS_SELECTOR, "tbody tr")
    APPROVE_BTNS = (By.XPATH, "//button[contains(text(),'Approve')]")
    REJECT_BTNS  = (By.XPATH, "//button[contains(text(),'Reject') or contains(text(),'Delete')]")
    STARS        = (By.CSS_SELECTOR, "[class*='star'], span[class*='rating']")

    def load(self):
        return self.open("/admin/reviews")

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)

    def review_count(self) -> int:
        return self.count(*self.ROWS)


# ── Admin Refunds ─────────────────────────────────────────────

class AdminRefundsPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    TABLE       = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS        = (By.CSS_SELECTOR, "tbody tr")
    PROCESS_BTN = (By.XPATH, "//button[contains(text(),'Process') or contains(text(),'Refund')]")

    def load(self):
        return self.open("/admin/refunds")

    def has_table(self) -> bool:
        return self.exists(*self.TABLE) or self.text_present("Refund")


# ── Admin Newsletter / Campaigns ──────────────────────────────

class AdminNewsletterPage(BasePage):
    HEADING        = (By.TAG_NAME, "h1")
    # Use contains(., 'text') to match full element value including SVG icon child text
    COMPOSE_BTN    = (By.XPATH, "//button[contains(.,'Campaign') or contains(.,'Compose') or contains(.,'New Campaign')]")
    SUBSCRIBER_TAB = (By.XPATH, "//button[contains(text(),'Subscriber')]")
    CAMPAIGN_LIST  = (By.CSS_SELECTOR, "table, [class*='campaign']")
    MODAL          = (By.CSS_SELECTOR, "[class*='modal'], [role='dialog']")
    SUBJECT_INPUT  = (By.CSS_SELECTOR, "input[placeholder*='subject'], input[name*='subject']")

    def load(self):
        return self.open("/admin/newsletter")

    def has_compose_button(self) -> bool:
        return self.exists(*self.COMPOSE_BTN)

    def open_compose(self):
        # Wait for button presence then JS-click to avoid SVG child interception
        from selenium.webdriver.support.ui import WebDriverWait as WDW
        from selenium.webdriver.support import expected_conditions as EC2
        try:
            btn = WDW(self.driver, 8).until(
                EC2.presence_of_element_located(self.COMPOSE_BTN)
            )
            self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
            time.sleep(0.2)
            self.driver.execute_script("arguments[0].click();", btn)
        except Exception:
            pass
        time.sleep(0.5)

    def modal_open(self) -> bool:
        # Newsletter compose is a fixed-position overlay (not role=dialog)
        # Check for MODAL selector OR for the subject input that appears in compose form
        return (self.exists(*self.MODAL, 2) or
                self.exists(By.CSS_SELECTOR, "input[placeholder*='arrivals'], input[placeholder*='subject'], input[placeholder*='dropped']", 2))


# ── Admin Emails ──────────────────────────────────────────────

class AdminEmailsPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    TABLE     = (By.CSS_SELECTOR, "table, .admin-table")

    def load(self):
        return self.open("/admin/emails")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 100


# ── Admin Messages ────────────────────────────────────────────

class AdminMessagesPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    TABLE     = (By.CSS_SELECTOR, "table, .admin-table")
    MSG_LIST  = (By.CSS_SELECTOR, "[class*='message'], tr")

    def load(self):
        return self.open("/admin/messages")

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)


# ── Admin Blog ────────────────────────────────────────────────

class AdminBlogPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    ADD_BTN     = (By.CSS_SELECTOR, "a[href*='blog/new'], button[class*='btn-gold']")
    TABLE       = (By.CSS_SELECTOR, "table, .admin-table")
    ROWS        = (By.CSS_SELECTOR, "tbody tr")
    EDIT_LINKS  = (By.CSS_SELECTOR, "a[href*='edit']")
    STATUS_COL  = (By.XPATH, "//th[contains(text(),'Status') or contains(text(),'Published')]")

    def load(self):
        return self.open("/admin/blog")

    def has_add_button(self) -> bool:
        return self.exists(*self.ADD_BTN)

    def has_table(self) -> bool:
        return self.exists(*self.TABLE)

    def post_count(self) -> int:
        return self.count(*self.ROWS)

    def click_add_post(self):
        self.click(*self.ADD_BTN)


class AdminNewBlogPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title'], input[placeholder*='title']")
    SLUG_INPUT  = (By.CSS_SELECTOR, "input[name='slug']")
    CONTENT_AREA= (By.CSS_SELECTOR, "textarea[name='content'], textarea")
    SUBMIT_BTN  = (By.CSS_SELECTOR, "button[type='submit']")
    PUBLISHED   = (By.CSS_SELECTOR, "input[name='published'], input[type='checkbox']")

    def load(self):
        return self.open("/admin/blog/new")

    def has_form(self) -> bool:
        return self.exists(*self.TITLE_INPUT) and self.exists(*self.CONTENT_AREA)


class AdminEditBlogPage(BasePage):
    HEADING     = (By.TAG_NAME, "h1")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title']")
    SAVE_BTN    = (By.CSS_SELECTOR, "button[type='submit']")

    def load(self, post_id: str):
        return self.open(f"/admin/blog/{post_id}/edit")

    def has_form(self) -> bool:
        return self.exists(*self.TITLE_INPUT)


# ── Admin Bundles ─────────────────────────────────────────────

class AdminBundlesPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    ADD_BTN      = (By.CSS_SELECTOR, "button[class*='btn-gold']")
    TABLE        = (By.CSS_SELECTOR, "table, [class*='bundle']")
    ROWS         = (By.CSS_SELECTOR, "tbody tr, [class*='bundle-row']")
    MODAL        = (By.CSS_SELECTOR, "[class*='modal'], [role='dialog']")

    def load(self):
        return self.open("/admin/bundles")

    def has_add_button(self) -> bool:
        return self.exists(*self.ADD_BTN)

    def click_add(self):
        self.click(*self.ADD_BTN)
        time.sleep(0.5)

    def modal_open(self) -> bool:
        return self.exists(*self.MODAL, 3)

    def bundle_count(self) -> int:
        return self.count(*self.ROWS)


# ── Admin Analytics ───────────────────────────────────────────

class AdminAnalyticsPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    PERIOD_BTNS   = (By.CSS_SELECTOR, "button[class*='period'], button")
    REVENUE_STAT  = (By.XPATH, "//*[contains(text(),'Revenue') or contains(text(),'revenue')]")
    EXPORT_BTN    = (By.XPATH, "//button[contains(text(),'Export') or contains(text(),'CSV')]")
    CHART         = (By.CSS_SELECTOR, "[class*='chart'], [class*='bar'], canvas")
    TOP_PRODUCTS  = (By.XPATH, "//h2[contains(text(),'Top') or contains(text(),'Product')]")
    CUSTOMER_STATS= (By.XPATH, "//*[contains(text(),'Customer') or contains(text(),'customer')]")

    def load(self):
        return self.open("/admin/analytics")

    def has_revenue(self) -> bool:
        return self.exists(*self.REVENUE_STAT)

    def has_export(self) -> bool:
        return self.exists(*self.EXPORT_BTN)

    def has_top_products(self) -> bool:
        return self.exists(*self.TOP_PRODUCTS)

    def click_period(self, days: int):
        btns = self.find_all(By.CSS_SELECTOR, "button")
        for btn in btns:
            if str(days) in btn.text:
                self.scroll_to(btn)
                btn.click()
                time.sleep(1)
                return


# ── Admin TikTok ──────────────────────────────────────────────

class AdminTikTokPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    ADD_BTN      = (By.CSS_SELECTOR, "button[class*='btn-gold']")
    FEED_URL     = (By.XPATH, "//a[contains(@href, '/api/feeds')] | //span[contains(text(), '/api/feeds')]")
    POSTS_GRID   = (By.CSS_SELECTOR, "[class*='grid'], [class*='post']")
    TSV_BADGE    = (By.XPATH, "//*[contains(text(),'TSV') or contains(text(),'TikTok Shop')]")
    JSON_BADGE   = (By.XPATH, "//*[contains(text(),'JSON') or contains(text(),'Catalog')]")

    def load(self):
        return self.open("/admin/tiktok")

    def has_add_button(self) -> bool:
        return self.exists(*self.ADD_BTN)

    def has_feed_info(self) -> bool:
        return self.exists(*self.TSV_BADGE) or self.exists(*self.JSON_BADGE)


# ── Admin Instagram ───────────────────────────────────────────

class AdminInstagramPage(BasePage):
    HEADING  = (By.TAG_NAME, "h1")

    def load(self):
        return self.open("/admin/instagram")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 100


# ── Admin Collections ─────────────────────────────────────────

class AdminCollectionsPage(BasePage):
    HEADING    = (By.TAG_NAME, "h1")
    ADD_BTN    = (By.CSS_SELECTOR, "a[href*='collections/new'], button[class*='btn-gold']")
    TABLE      = (By.CSS_SELECTOR, "table, [class*='collection']")
    ROWS       = (By.CSS_SELECTOR, "tbody tr")

    def load(self):
        return self.open("/admin/collections")

    def has_add_button(self) -> bool:
        return self.exists(*self.ADD_BTN)

    def collection_count(self) -> int:
        return self.count(*self.ROWS)


class AdminNewCollectionPage(BasePage):
    HEADING    = (By.TAG_NAME, "h1")
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name'], input[placeholder*='Title'], input[placeholder*='e.g']")
    SAVE_BTN   = (By.CSS_SELECTOR, "button[type='submit'], button.btn-gold")

    def load(self):
        return self.open("/admin/collections/new")

    def has_form(self) -> bool:
        # CollectionForm uses inputs with placeholder, not name attribute
        return (self.exists(*self.NAME_INPUT) or
                self.exists(By.CSS_SELECTOR, "input[class*='input-dark'], input[placeholder]"))


class AdminEditCollectionPage(BasePage):
    HEADING    = (By.TAG_NAME, "h1")
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name']")
    SAVE_BTN   = (By.CSS_SELECTOR, "button[type='submit']")

    def load(self, collection_id: str):
        return self.open(f"/admin/collections/{collection_id}")

    def has_form(self) -> bool:
        return self.exists(*self.NAME_INPUT) or self.exists(*self.SAVE_BTN)


# ── Admin Affiliates / Referrals ──────────────────────────────

class AdminAffiliatesPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    TABLE     = (By.CSS_SELECTOR, "table, .admin-table")

    def load(self):
        return self.open("/admin/affiliates")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 100


class AdminReferralsPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    TABLE     = (By.CSS_SELECTOR, "table, .admin-table")

    def load(self):
        return self.open("/admin/referrals")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 100
