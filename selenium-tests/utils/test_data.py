"""
test_data.py — Static test data and constants used across all test files.
"""

import os

# ── URLs ───────────────────────────────────────────────────────
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

# ── Credentials ────────────────────────────────────────────────
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL", "admin@krishasparkles.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@1234")
USER_EMAIL     = os.getenv("TEST_USER_EMAIL", "testuser@example.com")
USER_PASSWORD  = os.getenv("TEST_USER_PASSWORD", "TestUser@1234")

# ── Slugs / Handles ────────────────────────────────────────────
PRODUCT_SLUG    = os.getenv("TEST_PRODUCT_SLUG", "test-product")
BLOG_SLUG       = os.getenv("TEST_BLOG_SLUG", "5-ways-to-style-jhumka-earrings")
BUNDLE_SLUG     = os.getenv("TEST_BUNDLE_SLUG", "test-bundle")
COLLECTION      = os.getenv("TEST_COLLECTION_HANDLE", "necklaces")
REFERRAL_CODE   = "TEST123"

# ── Form Inputs ────────────────────────────────────────────────
REGISTER_EMAIL    = "selenium_test_user@example.com"
REGISTER_PASSWORD = "SeleniumTest@1234"
REGISTER_NAME     = "Selenium Tester"

CONTACT_NAME    = "Test User"
CONTACT_EMAIL   = "contact_test@example.com"
CONTACT_PHONE   = "+1 555 000 1234"
CONTACT_MESSAGE = "This is a Selenium automated test message. Please ignore."

NEWSLETTER_EMAIL = "newsletter_selenium@example.com"

COUPON_VALID   = "WELCOME10"
COUPON_INVALID = "NOTEXIST999"

WHATSAPP_PHONE = "+1 555 123 4567"

# ── Expected Page Titles / H1s ─────────────────────────────────
EXPECTED_TITLES = {
    "/":                      "Krisha Sparkles",
    "/shop":                  "Shop",
    "/blog":                  "Style",          # "Style & Stories"
    "/bundles":               "Gift",           # "Gift Sets" or similar
    "/checkout":              "Checkout",
    "/contact":               "Contact",
    "/faq":                   "FAQ",
    "/support":               "Support",
    "/privacy-policy":        "Privacy",
    "/auth/login":            "Login",
    "/auth/register":         "Create",
    "/auth/forgot-password":  "Forgot",
    "/account":               "Account",
    "/account/orders":        "Orders",
    "/account/wishlist":      "Wishlist",
    "/account/points":        "Points",
    "/account/referrals":     "Referral",
    "/admin":                 "Dashboard",
    "/admin/products":        "Products",
    "/admin/orders":          "Orders",
    "/admin/inventory":       "Inventory",
    "/admin/promotions":      "Coupon",
    "/admin/reviews":         "Review",
    "/admin/newsletter":      "Campaign",
    "/admin/analytics":       "Analytics",
    "/admin/bundles":         "Bundle",
    "/admin/tiktok":          "TikTok",
    "/admin/blog":            "Blog",
}

# ── Nav Links ──────────────────────────────────────────────────
STORE_NAV_LINKS = [
    ("Home",      "/"),
    ("Shop",      "/shop"),
    ("Gift Sets", "/bundles"),
    ("Blog",      "/blog"),
]

ADMIN_NAV_LINKS = [
    "Dashboard",
    "Products",
    "Orders",
    "Inventory",
    "Analytics",
    "Blog",
    "Newsletter",
    "Bundles",
    "TikTok",
]
