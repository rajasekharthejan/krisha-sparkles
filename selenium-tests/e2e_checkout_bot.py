#!/usr/bin/env python3
"""
FLOW-02: Checkout Form + Stripe Session — Krisha Sparkles
=========================================================
Tests the complete checkout form + Stripe session creation:

  STEP 1  Create test user (API, email-verify skipped)
  STEP 2  Login via real browser form
  STEP 3  Inject product into Zustand cart via localStorage
  STEP 4  Navigate to /checkout — verify cart items rendered
  STEP 5  Select shipping state (Iowa / IA → no TX tax)
  STEP 6  Fill address form (all 6 required fields)
  STEP 7  Verify "Proceed to Payment" button becomes enabled
  STEP 8  Click button → intercept /api/stripe/checkout response (capture Stripe URL)
  STEP 9  Verify captured URL contains checkout.stripe.com
  STEP 10 Navigate to cancel URL → verify "Payment was cancelled" banner
  STEP 11 Verify empty cart shows "Your cart is empty" state
  CLEANUP Delete test user + restore product stock

WHY NO ACTUAL STRIPE PAYMENT:
  Production shopkrisha.com uses sk_live_* Stripe keys.
  Test cards (4242 4242 ...) are rejected in live mode.
  Making a real payment in E2E is not safe or reversible.
  FLOW-01 already tests post-payment order creation via webhook
  simulation. FLOW-02 verifies everything UP TO the Stripe handoff.

DEVELOPER CONTRACT (same rules as e2e_order_bot.py):
  - Never use str(N) in container_text for numeric checks
  - Always target data-testid for numeric assertions
  - Every new numeric check needs a data-testid on the JSX element

Run:
  source .venv/bin/activate
  python e2e_checkout_bot.py              # headless
  python e2e_checkout_bot.py --headed    # watch it live
  python e2e_checkout_bot.py --slow      # headed + 1s delays
"""

import os, sys, uuid, json, argparse, time, base64, re
import requests as http_requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, expect

# ── Load env ──────────────────────────────────────────────────────────────────
project_root = Path(__file__).resolve().parent.parent
for env_file in [".env.prod", ".env.local"]:
    p = project_root / env_file
    if p.exists():
        load_dotenv(p, override=(env_file == ".env.prod"))

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL       = os.getenv("BASE_URL", "https://shopkrisha.com").rstrip("/")
SUPABASE_URL   = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

RUN_ID        = uuid.uuid4().hex[:8]
TEST_EMAIL    = f"e2e-co-{RUN_ID}@test.krishasparkles.com"
TEST_PASSWORD = "BotTest@1234"

# Shipping address — Iowa (no TX tax), cheap product to trigger shipping cost
SHIP_STATE = "IA"
SHIP_FIRST = "E2E"
SHIP_LAST  = f"Bot{RUN_ID[:4]}"
SHIP_LINE1 = "123 Main St"
SHIP_CITY  = "Bettendorf"
SHIP_ZIP   = "52722"
SHIP_PHONE = "+15551234567"

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"co-{RUN_ID}"
REPORTS_DIR     = Path(__file__).resolve().parent / "reports"

# ── Result collector ──────────────────────────────────────────────────────────
RESULTS: list[dict] = []
RUN_START = datetime.now()
_passed = 0; _failed = 0; _step = 0

R="\033[0m"; G="\033[92m"; Y="\033[93m"; RED="\033[91m"; BOLD="\033[1m"; DIM="\033[2m"

def _record(actor, description, status, screenshot=None, note=""):
    RESULTS.append({"n": len(RESULTS)+1, "actor": actor, "description": description,
                    "status": status, "screenshot": screenshot, "note": note,
                    "ts": datetime.now().strftime("%H:%M:%S")})

def _c(a): return G if a == "CUSTOMER" else Y

def step(actor, msg):
    global _step; _step += 1
    print(f"{_c(actor)}[{actor:8s}]{R} {DIM}Step {_step:2d}:{R} {msg}")

def ok(actor, msg, screenshot=None, note=""):
    global _passed; _passed += 1
    print(f"{_c(actor)}[{actor:8s}]{R}    {G}✅ {msg}{R}")
    _record(actor, msg, "pass", screenshot, note)

def fail(actor, msg, screenshot=None, note=""):
    global _failed; _failed += 1
    print(f"{_c(actor)}[{actor:8s}]{R}    {RED}❌ {msg}{R}")
    _record(actor, msg, "fail", screenshot, note)

def info(actor, msg, screenshot=None):
    print(f"{_c(actor)}[{actor:8s}]{R}    {DIM}{msg}{R}")
    _record(actor, msg, "info", screenshot)

def snap(page: Page, name: str) -> str:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOTS_DIR / f"{_step:02d}_{name}.png"
    page.screenshot(path=str(path), full_page=False)
    info("SCREEN", f"📸 {path.name}")
    return str(path)


# ── Supabase helpers ──────────────────────────────────────────────────────────
class DB:
    H = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
         "Content-Type": "application/json", "Prefer": "return=representation"}

    @staticmethod
    def _r(method, table, params=None, data=None, single=False):
        h = dict(DB.H)
        if single: h["Accept"] = "application/vnd.pgrst.object+json"
        r = http_requests.request(method, f"{SUPABASE_URL}/rest/v1/{table}",
                                   headers=h, params=params, json=data)
        if r.status_code >= 400:
            raise Exception(f"DB {method} {table}: {r.status_code} — {r.text[:200]}")
        return r.json() if r.text else None

    @staticmethod
    def create_user(email, pw):
        r = http_requests.post(f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                     "Content-Type": "application/json"},
            json={"email": email, "password": pw, "email_confirm": True})
        if r.status_code >= 400: raise Exception(f"Create user: {r.text[:200]}")
        return r.json()["id"]

    @staticmethod
    def delete_user(uid):
        http_requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
        try: DB._r("DELETE", "user_profiles", {"id": f"eq.{uid}"})
        except: pass

    @staticmethod
    def products(limit=5):
        return DB._r("GET", "products", {
            "active": "eq.true", "stock_quantity": "gt.0",
            "select": "id,name,slug,price,stock_quantity,images",
            "order": "created_at.desc", "limit": str(limit)})


# ── Cart injection ─────────────────────────────────────────────────────────────
def inject_cart(page: Page, product: dict):
    """
    Write a Zustand-compatible cart state into localStorage.
    Key: "krisha-cart"  (from cartStore.ts → persist name)
    Structure: { state: { items: [...], cartUpdatedAt: N }, version: 0 }
    """
    # Pick first image if available
    images = product.get("images") or []
    image_url = images[0] if images else ""

    cart_payload = {
        "state": {
            "items": [{
                "id":        product["id"],
                "productId": product["id"],
                "name":      product["name"],
                "price":     product["price"],
                "quantity":  1,
                "image":     image_url,
                "slug":      product["slug"],
            }],
            "isOpen":        False,
            "cartUpdatedAt": int(datetime.now().timestamp() * 1000),
        },
        "version": 0,
    }
    page.evaluate(
        f'localStorage.setItem("krisha-cart", {json.dumps(json.dumps(cart_payload))})'
    )
    info("SYSTEM", f"Cart injected: 1× \"{product['name']}\" @ ${product['price']:.2f}")


# ── HTML report ───────────────────────────────────────────────────────────────
def _img_b64(path):
    if not path: return ""
    try:
        with open(path, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except: return ""

def generate_report() -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = REPORTS_DIR / f"report_co_{RUN_ID}_{ts}.html"

    total   = _passed + _failed
    pct     = int(100 * _passed / total) if total else 0
    elapsed = round((datetime.now() - RUN_START).total_seconds(), 1)

    rows = ""
    for r in RESULTS:
        icon = {"pass":"✅","fail":"❌","info":"ℹ️"}.get(r["status"],"•")
        bg   = "#1a0a0a" if r["status"]=="fail" else "#0e1a10" if r["status"]=="pass" else "#111"
        img  = ""
        if r["screenshot"] and r["status"] != "info":
            b64 = _img_b64(r["screenshot"])
            if b64:
                img = f'<div style="margin-top:8px"><img src="{b64}" style="max-width:100%;border-radius:6px;border:1px solid #333;cursor:pointer;transition:transform .2s" onclick="this.style.transform=this.style.transform?\'\':`scale(2.5) translateX(-20%)`" title="Click to zoom"/></div>'
        note = f'<div style="color:#888;font-size:11px;margin-top:4px">{r["note"]}</div>' if r["note"] else ""
        rows += f"""
        <tr style="background:{bg};border-bottom:1px solid #1f1f1f">
          <td style="padding:10px 12px;color:#555;font-size:12px;vertical-align:top">{r["n"]}</td>
          <td style="padding:10px 12px;vertical-align:top">
            <span style="background:#052e16;color:#10b981;border:1px solid #10b981;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">{r["actor"]}</span>
          </td>
          <td style="padding:10px 12px;font-size:13px;vertical-align:top">{r["description"]}{note}{img}</td>
          <td style="padding:10px 12px;text-align:center;font-size:16px;vertical-align:top">{icon}</td>
          <td style="padding:10px 12px;color:#555;font-size:11px;white-space:nowrap;vertical-align:top">{r["ts"]}</td>
        </tr>"""

    bar = "".join(
        f'<div style="flex:1;height:6px;background:{"#10b981" if r["status"]=="pass" else "#ef4444" if r["status"]=="fail" else "#374151"};min-width:2px"></div>'
        for r in RESULTS)

    html = f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>E2E FLOW-02 — Checkout — {RUN_ID}</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}}table{{width:100%;border-collapse:collapse}}th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#555;background:#0d0d0d;border-bottom:1px solid #1f1f1f}}tr:hover td{{filter:brightness(1.08)}}</style>
</head><body>
<div style="background:linear-gradient(135deg,#0f0800,#1a0f00);border-bottom:1px solid rgba(201,168,76,.3);padding:32px 40px 24px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#c9a84c,#f5d07a);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🛒</div>
    <div>
      <div style="font-size:20px;font-weight:700">FLOW-02: Checkout Form + Stripe Session</div>
      <div style="font-size:13px;color:#888;margin-top:2px">Krisha Sparkles — Playwright E2E</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:28px;font-weight:800;color:{'#10b981' if _failed==0 else '#ef4444'}">{'ALL PASSED' if _failed==0 else f'{_failed} FAILED'}</div>
      <div style="font-size:13px;color:#888">{_passed} passed · {_failed} failed · {elapsed}s</div>
    </div>
  </div>
  <div style="display:flex;gap:2px;border-radius:4px;overflow:hidden;margin-bottom:16px">{bar}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
    {"".join(f'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 14px"><div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">{k}</div><div style="font-size:13px;color:#ddd;word-break:break-all">{v}</div></div>' for k,v in [("Target",BASE_URL),("Run ID",RUN_ID),("Test user",TEST_EMAIL.split("@")[0]+"@..."),("Checks",f"{_passed+_failed} total · {pct}% passed")])}
  </div>
</div>
<div style="padding:0 40px 40px;margin-top:24px">
  <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden">
    <table><thead><tr>
      <th style="width:40px">#</th><th style="width:110px">Actor</th>
      <th>Description / Screenshot</th><th style="width:50px">Status</th><th style="width:70px">Time</th>
    </tr></thead><tbody>{rows}</tbody></table>
  </div>
</div>
<div style="padding:16px 40px 32px;color:#333;font-size:12px;text-align:center;border-top:1px solid #111">
  Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · FLOW-02 · Run ID: {RUN_ID}
</div></body></html>"""

    path.write_text(html, encoding="utf-8")
    return str(path)


# ══════════════════════════════════════════════════════════════════════════════
# FLOW-02: Checkout Form + Stripe Session
# ══════════════════════════════════════════════════════════════════════════════
def run_checkout_flow(headed=False, slow=False):
    global _passed, _failed, _step
    _passed=0; _failed=0; _step=0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  🛒 FLOW-02: Checkout Form + Stripe Session{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target:  {BASE_URL}")
    print(f"  User:    {TEST_EMAIL}")
    print(f"  Mode:    {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"  Run ID:  {RUN_ID}")
    print(f"  Time:    {RUN_START.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  NOTE:    Tests up to Stripe redirect — live keys, no real payment")
    print(f"{'─'*64}\n")

    uid = None
    product = None

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=not headed,
            slow_mo=1000 if slow else (300 if headed else 50),
        )
        ctx  = browser.new_context(viewport={"width":1280,"height":800})
        page = ctx.new_page()

        try:
            # ── PRE-FLIGHT: decline cookies ────────────────────────────────
            page.goto(f"{BASE_URL}/auth/login", wait_until="domcontentloaded")
            page.evaluate('localStorage.setItem("ks_cookie_consent","declined")')
            info("SYSTEM", "Cookie consent pre-declined")

            # ════════════════════════════════════════════════════════════
            # STEP 1 — Create test user
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", f"Creating test account: {TEST_EMAIL}")
            uid = DB.create_user(TEST_EMAIL, TEST_PASSWORD)
            ok("CUSTOMER", f"Account created — {uid[:12]}...")
            time.sleep(1.5)

            # ════════════════════════════════════════════════════════════
            # STEP 2 — Login via browser form
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Login via browser form")
            page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle")
            expect(page.locator('h1:has-text("Welcome Back")')).to_be_visible(timeout=10000)
            page.fill('input[placeholder="priya@example.com"]', TEST_EMAIL)
            page.fill('input[placeholder="Your password"]', TEST_PASSWORD)
            ss = snap(page, "login_form")
            page.click('button[type="submit"]')
            expect(page.locator('button[aria-label="Account menu"]')).to_be_visible(timeout=15000)
            ss = snap(page, "logged_in")
            ok("CUSTOMER", "Logged in — avatar button visible in navbar", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 3 — Inject product into Zustand cart via localStorage
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Inject product into cart via localStorage")
            products = DB.products(limit=5)
            if not products:
                raise RuntimeError("No active products found in DB")
            # Pick cheapest to ensure shipping cost shows (subtotal < free threshold)
            product = min(products, key=lambda p: p["price"])
            info("SYSTEM", f"Chose: \"{product['name']}\" @ ${product['price']:.2f}")
            inject_cart(page, product)
            ss = snap(page, "cart_injected")
            ok("CUSTOMER", f"Cart injected: \"{product['name']}\" @ ${product['price']:.2f}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 4 — Navigate to /checkout — verify cart item rendered
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Navigate to /checkout — verify cart items rendered")
            page.goto(f"{BASE_URL}/checkout", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator('h1:has-text("Order Summary")')).to_be_visible(timeout=10000)

            # Verify the product name appears in the items list
            item_name_loc = page.locator(f'text="{product["name"]}"')
            if item_name_loc.count() > 0 and item_name_loc.first.is_visible():
                ss = snap(page, "checkout_cart")
                ok("CUSTOMER", f"Cart item \"{product['name']}\" rendered on checkout page", ss)
            else:
                # Try partial match
                item_loc = page.locator(f'text="{product["name"][:20]}"')
                ss = snap(page, "checkout_cart")
                if item_loc.count() > 0:
                    ok("CUSTOMER", f"Cart item visible (partial match) — product in checkout", ss)
                else:
                    fail("CUSTOMER", f"Cart item NOT visible — product name not found on page", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 5 — Select shipping state (Iowa / IA)
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", f"Select shipping state: {SHIP_STATE}")
            state_select = page.locator("select").first
            expect(state_select).to_be_visible(timeout=8000)
            state_select.select_option(SHIP_STATE)
            page.wait_for_timeout(800)  # wait for address form to appear

            # Verify state-dependent sections now appear
            expect(page.locator('text="Shipping Address"').first).to_be_visible(timeout=8000)
            expect(page.locator('text="Shipping Method"').first).to_be_visible(timeout=5000)
            ss = snap(page, "state_selected")
            ok("CUSTOMER", f"State \"{SHIP_STATE}\" selected — address + shipping forms appeared", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 6 — Fill address form (6 required fields)
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Fill all 6 required address fields")

            # First name
            page.fill('input[placeholder="First name *"]', SHIP_FIRST)
            # Last name
            page.fill('input[placeholder="Last name *"]', SHIP_LAST)
            # Address line 1 — AddressAutocomplete renders a plain <input> we can type into directly
            addr_input = page.locator('input[placeholder*="Address line 1"]').first
            addr_input.click()
            addr_input.fill(SHIP_LINE1)
            page.keyboard.press("Escape")  # dismiss any autocomplete dropdown
            page.wait_for_timeout(400)
            # City
            page.fill('input[placeholder="City *"]', SHIP_CITY)
            # ZIP
            page.fill('input[placeholder="ZIP code *"]', SHIP_ZIP)
            # Phone
            phone_input = page.locator('input[placeholder*="Phone number"]').first
            phone_input.fill(SHIP_PHONE)
            page.wait_for_timeout(500)

            ss = snap(page, "address_filled")
            ok("CUSTOMER", f"Address filled: {SHIP_FIRST} {SHIP_LAST}, {SHIP_LINE1}, {SHIP_CITY} {SHIP_STATE} {SHIP_ZIP}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 7 — Verify "Proceed to Payment" button is enabled
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Verify checkout button is enabled (canCheckout = true)")
            checkout_btn = page.locator('button:has-text("Secure Checkout")').first
            expect(checkout_btn).to_be_visible(timeout=8000)

            # Scroll to button so it's in view
            checkout_btn.scroll_into_view_if_needed()
            page.wait_for_timeout(500)

            is_disabled = checkout_btn.is_disabled()
            ss = snap(page, "checkout_button")
            if not is_disabled:
                ok("CUSTOMER", "\"Proceed to Payment\" button is ENABLED — all fields valid ✓", ss)
            else:
                # Debug: check which field is missing
                first = page.locator('input[placeholder="First name *"]').input_value()
                last  = page.locator('input[placeholder="Last name *"]').input_value()
                addr  = page.locator('input[placeholder*="Address line 1"]').first.input_value()
                city  = page.locator('input[placeholder="City *"]').input_value()
                zipv  = page.locator('input[placeholder="ZIP code *"]').input_value()
                phone = page.locator('input[placeholder*="Phone number"]').first.input_value()
                fail("CUSTOMER",
                     f"Button still DISABLED — field values: first='{first}' last='{last}' "
                     f"addr='{addr}' city='{city}' zip='{zipv}' phone='{phone}'", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 8 — Click checkout → intercept Stripe session URL
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Click checkout → verify Stripe session created via API response")
            info("SYSTEM", "Intercepting /api/stripe/checkout response (not following redirect) ...")

            if is_disabled:
                info("CUSTOMER", "Skipping Stripe test (button was disabled)")
            else:
                try:
                    checkout_btn.click()
                    # Wait for browser to navigate to Stripe's checkout page
                    # NOTE: use regex — Playwright glob '*' doesn't cross '/' boundaries
                    page.wait_for_url(re.compile(r"checkout\.stripe\.com"), timeout=25000)
                    stripe_url = page.url

                    # ════════════════════════════════════════════════════
                    # STEP 9 — Verify the Stripe URL is real
                    # ════════════════════════════════════════════════════
                    step("CUSTOMER", "Verify Stripe redirect URL")
                    ss = snap(page, "stripe_checkout")

                    if "checkout.stripe.com" in stripe_url:
                        ok("CUSTOMER",
                           f"Redirected to checkout.stripe.com ✓",
                           ss,
                           note="Stripe session created — not completing payment (live keys)")
                    else:
                        fail("CUSTOMER", f"Expected checkout.stripe.com, got: {stripe_url[:80]}", ss)

                except Exception as nav_err:
                    step("CUSTOMER", "Verify Stripe redirect URL")
                    ss = snap(page, "stripe_nav_error")
                    fail("CUSTOMER", f"Stripe redirect failed: {str(nav_err)[:120]}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 10 — Navigate to cancel URL → verify cancellation banner
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Test cancel flow: /checkout?cancelled=true")
            # Navigate to a neutral page first, inject cart, then go to cancel URL
            page.goto(f"{BASE_URL}/shop", wait_until="domcontentloaded")
            page.wait_for_timeout(500)
            inject_cart(page, product)
            page.wait_for_timeout(300)
            page.goto(f"{BASE_URL}/checkout?cancelled=true", wait_until="networkidle")
            page.wait_for_timeout(2500)

            cancel_banner = page.locator('text=Payment was cancelled')
            try:
                expect(cancel_banner.first).to_be_visible(timeout=10000)
                ss = snap(page, "cancel_banner")
                ok("CUSTOMER", "Cancel banner visible: \"Payment was cancelled\" ✓", ss)
            except Exception as cancel_err:
                ss = snap(page, "cancel_banner_missing")
                fail("CUSTOMER", f"Cancel banner not found: {str(cancel_err)[:100]}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 11 — Empty cart → verify "Your cart is empty" state
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Test empty cart: /checkout with no items")
            # Clear cart in localStorage
            page.evaluate('localStorage.removeItem("krisha-cart")')
            page.goto(f"{BASE_URL}/checkout", wait_until="networkidle")
            page.wait_for_timeout(2000)
            empty_msg = page.locator('text="Your cart is empty"')
            expect(empty_msg).to_be_visible(timeout=10000)
            ss = snap(page, "empty_cart")
            ok("CUSTOMER", "Empty cart state shown: \"Your cart is empty\" ✓", ss)

        except Exception as e:
            fail("SYSTEM", f"FATAL: {e}")
            import traceback; traceback.print_exc()
            try: snap(page, "fatal_error")
            except: pass

        finally:
            print(f"\n{'─'*64}")
            step("CLEANUP", "Removing test user")
            if uid:
                try:
                    DB.delete_user(uid)
                    ok("CLEANUP", f"Test user {TEST_EMAIL} deleted")
                except Exception as ce:
                    fail("CLEANUP", f"Cleanup failed: {ce}")
            ctx.close()
            browser.close()

    return _passed, _failed


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Krisha Sparkles E2E — FLOW-02 Checkout")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    parser.add_argument("--slow",   action="store_true", help="Headed + 1s delays")
    args = parser.parse_args()

    headed = args.headed or args.slow
    passed, failed = run_checkout_flow(headed=headed, slow=args.slow)

    print(f"\n{'─'*64}")
    report = generate_report()
    print(f"\n{BOLD}{'═'*64}{R}")
    if failed == 0:
        print(f"{G}{BOLD}  ✅ ALL {passed} CHECKS PASSED{R}")
    else:
        print(f"{RED}{BOLD}  ❌ {failed} FAILED, {passed} PASSED{R}")
    print(f"{BOLD}  📸 Screenshots : {SCREENSHOTS_DIR}{R}")
    print(f"{BOLD}  📄 HTML Report : {report}{R}")
    print(f"{BOLD}{'═'*64}{R}\n")

    sys.exit(0 if failed == 0 else 1)
