# Krisha Sparkles — Selenium Test Suite

Comprehensive end-to-end Selenium tests covering all **54 pages** of the Krisha Sparkles e-commerce website.

## 📁 Project Structure

```
selenium-tests/
├── conftest.py              # Fixtures: driver, admin_driver, user_driver
├── pytest.ini               # Pytest config, markers, HTML reports
├── requirements.txt         # Python dependencies
├── .env.test                # Test configuration (copy & edit)
├── run_tests.sh             # Shell runner with filter options
│
├── pages/                   # Page Object Models (POM)
│   ├── base_page.py         # Shared base class
│   ├── store/
│   │   ├── home_page.py
│   │   ├── shop_page.py
│   │   ├── product_detail_page.py
│   │   ├── blog_page.py         # BlogPage + BlogPostPage
│   │   ├── bundles_page.py      # BundlesPage + BundleDetailPage
│   │   ├── checkout_page.py     # CheckoutPage + OrderSuccessPage
│   │   ├── static_pages.py      # Contact, FAQ, Support, Privacy, Ref
│   │   ├── auth/
│   │   │   └── auth_pages.py    # Login, Register, ForgotPwd, ResetPwd
│   │   └── account/
│   │       └── account_pages.py # Dashboard, Orders, Profile, Wishlist, Points, Referrals
│   └── admin/
│       └── admin_pages.py       # All 28 admin page POMs
│
├── tests/
│   ├── test_navigation.py       # All-routes parametrized navigation tests
│   ├── store/
│   │   ├── test_home.py         # 18 tests
│   │   ├── test_shop.py         # 13 tests
│   │   ├── test_product_detail.py # 9 tests
│   │   ├── test_blog.py         # 26 tests (listing + post)
│   │   ├── test_bundles.py      # 14 tests (listing + detail)
│   │   ├── test_checkout.py     # 14 tests (checkout + order success)
│   │   ├── test_static_pages.py # 30 tests (Contact, FAQ, Support, Privacy, Ref)
│   │   ├── auth/
│   │   │   └── test_auth.py     # 30 tests (Login, Register, ForgotPwd, ResetPwd)
│   │   └── account/
│   │       └── test_account.py  # 35 tests (Dashboard, Orders, Profile, Wishlist, Points, Referrals)
│   └── admin/
│       └── test_admin_all.py    # 90+ tests covering all 28 admin pages
│
├── utils/
│   ├── helpers.py           # Shared utility functions
│   └── test_data.py         # Test constants and credentials
│
├── reports/                 # Auto-generated HTML reports
└── screenshots/             # Failure screenshots (auto-captured)
```

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd selenium-tests
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.test .env.test.local   # Edit with your settings
```

Edit `.env.test` key settings:
```ini
BASE_URL=http://localhost:3000      # or https://shopkrisha.com
ADMIN_EMAIL=admin@krishasparkles.com
ADMIN_PASSWORD=Admin@1234
BROWSER=chrome                      # chrome | firefox | edge
HEADLESS=false                      # true for CI
```

### 3. Start the App
```bash
# In the krisha-sparkles/ root:
npm run dev
```

### 4. Run Tests

```bash
# All 54 pages — full suite
./run_tests.sh

# Individual categories
./run_tests.sh store      # Customer pages
./run_tests.sh admin      # Admin panel
./run_tests.sh auth       # Auth flows
./run_tests.sh account    # Account pages (needs login)
./run_tests.sh nav        # Navigation tests
./run_tests.sh blog       # Blog tests only

# Specific options
./run_tests.sh headless   # All tests, headless Chrome
./run_tests.sh parallel   # 4 parallel workers (fast!)

# Direct pytest commands
PYTHONPATH=. pytest tests/store/test_home.py -v
PYTHONPATH=. pytest -m smoke -v
PYTHONPATH=. pytest -k "TestAdminAnalytics" -v
```

## 📋 Pages Tested (54 Total)

### 🛍️ Store Pages (26)

| # | Page | Test File | Tests |
|---|------|-----------|-------|
| 1 | Home (`/`) | test_home.py | 18 |
| 2 | Shop (`/shop`) | test_shop.py | 13 |
| 3 | Product Detail (`/shop/[slug]`) | test_product_detail.py | 9 |
| 4 | Blog Listing (`/blog`) | test_blog.py | 12 |
| 5 | Blog Post (`/blog/[slug]`) | test_blog.py | 14 |
| 6 | Bundles (`/bundles`) | test_bundles.py | 8 |
| 7 | Bundle Detail (`/bundles/[slug]`) | test_bundles.py | 6 |
| 8 | Checkout (`/checkout`) | test_checkout.py | 11 |
| 9 | Order Success (`/order-success`) | test_checkout.py | 3 |
| 10 | Contact (`/contact`) | test_static_pages.py | 9 |
| 11 | FAQ (`/faq`) | test_static_pages.py | 7 |
| 12 | Support (`/support`) | test_static_pages.py | 5 |
| 13 | Privacy Policy (`/privacy-policy`) | test_static_pages.py | 6 |
| 14 | Referral Landing (`/ref/[code]`) | test_static_pages.py | 3 |
| 15 | Login (`/auth/login`) | test_auth.py | 11 |
| 16 | Register (`/auth/register`) | test_auth.py | 9 |
| 17 | Forgot Password (`/auth/forgot-password`) | test_auth.py | 7 |
| 18 | Reset Password (`/auth/reset-password`) | test_auth.py | 3 |
| 19 | Account Dashboard (`/account`) | test_account.py | 7 |
| 20 | Orders (`/account/orders`) | test_account.py | 4 |
| 21 | Profile (`/account/profile`) | test_account.py | 5 |
| 22 | Wishlist (`/account/wishlist`) | test_account.py | 3 |
| 23 | Loyalty Points (`/account/points`) | test_account.py | 5 |
| 24 | Referrals (`/account/referrals`) | test_account.py | 5 |
| 25 | Collections (`/collections/[handle]`) | test_navigation.py | parametrized |
| 26 | All Routes | test_navigation.py | 12 |

### ⚙️ Admin Pages (28)

| # | Page | Tests |
|---|------|-------|
| 1 | Admin Login | 9 |
| 2 | Dashboard | 14 |
| 3 | Products | 7 |
| 4 | New Product | 8 |
| 5 | Edit Product | (dynamic) |
| 6 | Bulk Upload | 3 |
| 7 | Bulk Price | 3 |
| 8 | Orders | 6 |
| 9 | Order Detail | (dynamic) |
| 10 | Inventory | 6 |
| 11 | Promotions | 6 |
| 12 | Reviews | 3 |
| 13 | Refunds | 3 |
| 14 | Newsletter | 6 |
| 15 | Emails | 2 |
| 16 | Messages | 3 |
| 17 | Blog Admin | 6 |
| 18 | New Blog Post | 6 |
| 19 | Edit Blog Post | (dynamic) |
| 20 | Bundles Admin | 5 |
| 21 | Analytics | 9 |
| 22 | TikTok Admin | 5 |
| 23 | Instagram Admin | 3 |
| 24 | Collections | 4 |
| 25 | New Collection | 4 |
| 26 | Edit Collection | (dynamic) |
| 27 | Affiliates | 3 |
| 28 | Admin Referrals | 3 |

**Total: 280+ individual test cases**

## 🏷️ Pytest Markers

| Marker | Description |
|--------|-------------|
| `store` | Customer-facing page tests |
| `admin` | Admin panel tests |
| `auth` | Authentication flow tests |
| `account` | Account section (requires user login) |
| `smoke` | Quick sanity check tests |
| `slow` | Tests that take longer |

Run by marker: `pytest -m store -v`

## 📸 Screenshots & Reports

- **HTML Report**: `reports/test_report.html` — auto-generated after each run
- **Screenshots**: `screenshots/` — automatically captured on test failure
- Each screenshot is named: `test_name_YYYYMMDD_HHMMSS.png`

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | App URL to test against |
| `BROWSER` | `chrome` | `chrome`, `firefox`, or `edge` |
| `HEADLESS` | `false` | Set `true` for CI |
| `IMPLICIT_WAIT` | `10` | Seconds to wait for elements |
| `PAGE_LOAD_TIMEOUT` | `30` | Page load timeout |
| `ADMIN_EMAIL` | — | Admin login email |
| `ADMIN_PASSWORD` | — | Admin login password |
| `TEST_BLOG_SLUG` | `5-ways-to-style-jhumka-earrings` | Seeded blog post slug |

## 🔄 CI/CD Integration

The test suite supports parallel execution:
```bash
HEADLESS=true PYTHONPATH=. pytest -n auto --reruns=2 -v
```

Add to GitHub Actions:
```yaml
- name: Run Selenium Tests
  run: |
    cd selenium-tests
    pip install -r requirements.txt
    HEADLESS=true BASE_URL=${{ vars.BASE_URL }} PYTHONPATH=. pytest -n 4 -v
```
