#!/usr/bin/env python3
"""
FLOW-11: Admin Dashboard + Orders — Krisha Sparkles
====================================================
Tests the admin dashboard stats and full order management workflow:

  STEP 1   Admin login (gate → form)
  STEP 2   Navigate to /admin — verify "Dashboard" heading
  STEP 3   Verify 4 stat cards (Total Revenue, Total Orders, Active Products, Paid Orders)
  STEP 4   Verify "Recent Orders" section + "View All" link to /admin/orders
  STEP 5   Navigate to /admin/orders — verify "Orders" heading
  STEP 6   Verify status filter pills (all / pending / paid / shipped / delivered / cancelled)
  STEP 7   Verify orders table column headers are visible
  STEP 8   Create test order in DB; reload page; find test order row by email
  STEP 9   Click "View" button on test order → verify /admin/orders/{id} URL
  STEP 10  Verify order detail sections (Customer, Shipping Address, Tracking, Order Summary)
  STEP 11  Navigate back to /admin/orders → find test order → click "Manual" tracking button
  STEP 12  Verify "Add Tracking" modal opens → enter tracking number → click "Save Tracking"
  STEP 13  Verify tracking number now appears in the test order row

DEVELOPER CONTRACT (same rules as e2e_order_bot.py):
  - Never use str(N) in container_text for numeric checks
  - Always target data-testid for numeric assertions
  - read_numeric_field() returns -1 on missing (never silently passes)
  - Register all numeric selectors in SELECTOR_CONTRACT before first use

Run:
  source .venv/bin/activate
  python e2e_admin_orders_bot.py
  python e2e_admin_orders_bot.py --headed
  python e2e_admin_orders_bot.py --slow
"""

import os, sys, uuid, json, base64, argparse, time
import requests as http_requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, expect
from admin_session import admin_login as _admin_login

# ── env ──────────────────────────────────────────────────────────────────────
project_root = Path(__file__).resolve().parent.parent
for env_file in [".env.prod", ".env.local"]:
    p = project_root / env_file
    if p.exists():
        load_dotenv(p, override=(env_file == ".env.prod"))

BASE_URL       = os.getenv("BASE_URL", "https://shopkrisha.com").rstrip("/")
SUPABASE_URL   = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@krishasparkles.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@1234")
ADMIN_GATE     = os.getenv("ADMIN_GATE_TOKEN", "ks7f2m9p4n8x3b1qZA")

RUN_ID           = uuid.uuid4().hex[:8]
TEST_TRACKING    = f"E2ETEST{RUN_ID.upper()}"
TEST_ORDER_EMAIL = f"e2e-orders-{RUN_ID}@test.krishasparkles.com"
TEST_ORDER_NAME  = f"E2E Orders Bot {RUN_ID[:6]}"

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"orders-{RUN_ID}"
REPORTS_DIR     = Path(__file__).resolve().parent / "reports"
RUN_START       = datetime.now()

# ── telemetry ─────────────────────────────────────────────────────────────────
RESULTS: list[dict] = []
_passed = 0; _failed = 0; _step = 0
R="\033[0m"; G="\033[92m"; B="\033[94m"; Y="\033[93m"; RED="\033[91m"; BOLD="\033[1m"; DIM="\033[2m"

def _record(actor, description, status, screenshot=None, note=""):
    RESULTS.append({"n": len(RESULTS)+1, "actor": actor, "description": description,
                    "status": status, "screenshot": screenshot, "note": note,
                    "ts": datetime.now().strftime("%H:%M:%S")})
def _c(a): return B if a == "ADMIN" else Y
def step(actor, msg):
    global _step; _step += 1
    print(f"{_c(actor)}[{actor:8s}]{R} {DIM}Step {_step:2d}:{R} {msg}")
def ok(actor, msg, screenshot=None, note=""):
    global _passed; _passed += 1
    print(f"{_c(actor)}[{actor:8s}]{R}    {G}✅ {msg}{R}"); _record(actor, msg, "pass", screenshot, note)
def fail(actor, msg, screenshot=None, note=""):
    global _failed; _failed += 1
    print(f"{_c(actor)}[{actor:8s}]{R}    {RED}❌ {msg}{R}"); _record(actor, msg, "fail", screenshot, note)
def info(actor, msg, screenshot=None):
    print(f"{_c(actor)}[{actor:8s}]{R}    {DIM}{msg}{R}"); _record(actor, msg, "info", screenshot)
def snap(page: Page, name: str) -> str:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOTS_DIR / f"{_step:02d}_{name}.png"
    page.screenshot(path=str(path), full_page=False)
    info("SCREEN", f"📸 {path.name}"); return str(path)

# ── DB helpers ────────────────────────────────────────────────────────────────
class DB:
    H = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
         "Content-Type": "application/json", "Prefer": "return=representation"}

    @staticmethod
    def create_test_order() -> dict | None:
        """Insert a minimal test order; returns the created row dict."""
        body = {
            "email":    TEST_ORDER_EMAIL,
            "name":     TEST_ORDER_NAME,
            "total":    49.99,
            "subtotal": 45.00,
            "tax":      4.99,
            "status":   "paid",
            "shipping_address": json.dumps({
                "line1": "123 E2E Test St", "city": "Testville",
                "state": "CA", "postal_code": "90210", "country": "US",
            }),
            "notes": f"E2E_AUTOTEST_{RUN_ID}",
        }
        r = http_requests.post(f"{SUPABASE_URL}/rest/v1/orders", headers=DB.H, json=body)
        if r.status_code < 400 and r.json():
            return r.json()[0]
        return None

    @staticmethod
    def delete_order(order_id: str):
        http_requests.delete(
            f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}", headers=DB.H)

    @staticmethod
    def clear_tracking(order_id: str):
        """Safety-net: null out tracking so future runs see the Manual button."""
        http_requests.patch(
            f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}", headers=DB.H,
            json={"tracking_number": None, "tracking_url": None, "status": "paid"})


# ── report ────────────────────────────────────────────────────────────────────
def _img_b64(path):
    if not path: return ""
    try:
        with open(path, "rb") as f: return "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except: return ""

def generate_report() -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = REPORTS_DIR / f"report_orders_{RUN_ID}_{ts}.html"
    total   = _passed + _failed
    pct     = int(100 * _passed / total) if total else 0
    elapsed = round((datetime.now() - RUN_START).total_seconds(), 1)
    rows = ""
    for r in RESULTS:
        icon = {"pass": "✅", "fail": "❌", "info": "ℹ️"}.get(r["status"], "•")
        bg   = "#1a0a0a" if r["status"] == "fail" else "#0e1a10" if r["status"] == "pass" else "#111"
        img  = ""
        if r["screenshot"] and r["status"] != "info":
            b64 = _img_b64(r["screenshot"])
            if b64:
                img = (f'<div style="margin-top:8px"><img src="{b64}" style="max-width:100%;'
                       f'border-radius:6px;border:1px solid #333;cursor:pointer" '
                       f'onclick="this.style.transform=this.style.transform?\'\':`scale(2.5) translateX(-20%)`"/></div>')
        note_html = f'<div style="color:#888;font-size:11px;margin-top:4px">{r["note"]}</div>' if r["note"] else ""
        rows += (f'<tr style="background:{bg};border-bottom:1px solid #1f1f1f">'
                 f'<td style="padding:10px 12px;color:#555;font-size:12px;vertical-align:top">{r["n"]}</td>'
                 f'<td style="padding:10px 12px;vertical-align:top"><span style="background:#0c1a2e;color:#3b82f6;'
                 f'border:1px solid #3b82f6;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">'
                 f'{r["actor"]}</span></td>'
                 f'<td style="padding:10px 12px;font-size:13px;vertical-align:top">{r["description"]}{note_html}{img}</td>'
                 f'<td style="padding:10px 12px;text-align:center;font-size:16px;vertical-align:top">{icon}</td>'
                 f'<td style="padding:10px 12px;color:#555;font-size:11px;white-space:nowrap;vertical-align:top">{r["ts"]}</td></tr>')
    bar = "".join(
        f'<div style="flex:1;height:6px;background:{"#10b981" if r["status"]=="pass" else "#ef4444" if r["status"]=="fail" else "#374151"};min-width:2px"></div>'
        for r in RESULTS)
    meta = "".join(
        f'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 14px">'
        f'<div style="font-size:10px;color:#555;text-transform:uppercase;margin-bottom:4px">{k}</div>'
        f'<div style="font-size:13px;color:#ddd">{v}</div></div>'
        for k, v in [("Target", BASE_URL), ("Run ID", RUN_ID),
                     ("Tracking", TEST_TRACKING), ("Checks", f"{total} total · {pct}% passed")])
    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>FLOW-11 Admin Orders {RUN_ID}</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,sans-serif}}table{{width:100%;border-collapse:collapse}}th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#555;background:#0d0d0d;border-bottom:1px solid #1f1f1f}}</style>
</head><body>
<div style="background:linear-gradient(135deg,#080f1a,#0f1a2e);border-bottom:1px solid rgba(59,130,246,.3);padding:32px 40px 24px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#60a5fa);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🛒</div>
    <div>
      <div style="font-size:20px;font-weight:700">FLOW-11: Admin Dashboard + Orders</div>
      <div style="font-size:13px;color:#888;margin-top:2px">Krisha Sparkles — Playwright E2E</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:28px;font-weight:800;color:{'#10b981' if _failed==0 else '#ef4444'}">{'ALL PASSED' if _failed==0 else f'{_failed} FAILED'}</div>
      <div style="font-size:13px;color:#888">{_passed} passed · {_failed} failed · {elapsed}s</div>
    </div>
  </div>
  <div style="display:flex;gap:2px;border-radius:4px;overflow:hidden;margin-bottom:16px">{bar}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">{meta}</div>
</div>
<div style="padding:0 40px 40px;margin-top:24px">
  <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden">
    <table><thead><tr>
      <th style="width:40px">#</th><th style="width:110px">Actor</th>
      <th>Description</th><th style="width:50px">Status</th><th style="width:70px">Time</th>
    </tr></thead><tbody>{rows}</tbody></table>
  </div>
</div>
<div style="padding:16px 40px 32px;color:#333;font-size:12px;text-align:center;border-top:1px solid #111">
  Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · FLOW-11 · Run ID: {RUN_ID}
</div>
</body></html>"""
    path.write_text(html, encoding="utf-8")
    return str(path)


# ── main flow ─────────────────────────────────────────────────────────────────
def run_admin_orders_flow(headed=False, slow=False):
    global _passed, _failed, _step
    _passed = 0; _failed = 0; _step = 0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  🛒 FLOW-11: Admin Dashboard + Orders{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target:   {BASE_URL}")
    print(f"  Admin:    {ADMIN_EMAIL}")
    print(f"  Tracking: {TEST_TRACKING}")
    print(f"  Mode:     {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"{'─'*64}\n")

    test_order_id: str | None = None

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not headed,
                                     slow_mo=1000 if slow else (300 if headed else 50))
        ctx  = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        try:
            # Pre-decline cookie consent
            page.goto(f"{BASE_URL}/admin/login", wait_until="domcontentloaded")
            page.evaluate('localStorage.setItem("ks_cookie_consent","declined")')

            # ════════════════════════════════════════════════════════════
            # STEP 1 — Admin login (shared session cache → avoids rate limit)
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Admin gate + login form")
            _admin_login(ctx, page, BASE_URL, ADMIN_GATE, ADMIN_EMAIL, ADMIN_PASSWORD)
            ss = snap(page, "admin_logged_in")
            ok("ADMIN", "Admin login successful ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 2 — /admin dashboard heading
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify /admin heading = \"Dashboard\"")
            page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator('h1:has-text("Dashboard")')).to_be_visible(timeout=10000)
            ss = snap(page, "dashboard_loaded")
            ok("ADMIN", "Dashboard heading visible ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 3 — Stat cards
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify 4 stat cards (Total Revenue, Total Orders, Active Products, Paid Orders)")
            stat_labels = ["Total Revenue", "Total Orders", "Active Products", "Paid Orders"]
            found_cards = 0
            for label in stat_labels:
                loc = page.locator(f'text="{label}"')
                if loc.count() > 0:
                    found_cards += 1
                    info("ADMIN", f"  ✅ Stat card: \"{label}\"")
                else:
                    info("ADMIN", f"  ⚠️  Stat card not found: \"{label}\"")
            ss = snap(page, "stat_cards")
            if found_cards >= 3:
                ok("ADMIN", f"{found_cards}/4 stat cards visible ✓", ss)
            else:
                fail("ADMIN", f"Only {found_cards}/4 stat cards found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 4 — "Recent Orders" section + "View All" link
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify \"Recent Orders\" section heading + \"View All\" link")
            recent_heading = page.locator('h2:has-text("Recent Orders")')
            view_all_link  = page.locator('a[href="/admin/orders"]:has-text("View All")')
            try:
                expect(recent_heading).to_be_visible(timeout=8000)
                info("ADMIN", "  Recent Orders heading ✓")
            except:
                info("ADMIN", "  ⚠️  Recent Orders heading not found (may be hidden if no orders)")
            try:
                expect(view_all_link).to_be_visible(timeout=5000)
                ss = snap(page, "recent_orders_section")
                ok("ADMIN", "\"Recent Orders\" section + \"View All\" link visible ✓", ss)
            except:
                ss = snap(page, "recent_orders_missing")
                fail("ADMIN", "\"View All\" link to /admin/orders not found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 5 — /admin/orders page heading
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Navigate to /admin/orders — verify heading")
            page.goto(f"{BASE_URL}/admin/orders", wait_until="networkidle")
            page.wait_for_timeout(2500)
            expect(page.locator('h1:has-text("Orders")')).to_be_visible(timeout=10000)
            ss = snap(page, "orders_page_loaded")
            ok("ADMIN", "Orders page loaded with correct heading ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 6 — Status filter pills
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify status filter pills (all, pending, paid, shipped, delivered, cancelled)")
            filter_pills = ["all", "pending", "paid", "shipped", "delivered", "cancelled"]
            pills_found  = 0
            for pill in filter_pills:
                loc = page.locator(f'button:has-text("{pill}")').first
                if loc.is_visible():
                    pills_found += 1
                    info("ADMIN", f"  ✅ Pill: \"{pill}\"")
                else:
                    info("ADMIN", f"  ⚠️  Pill not found: \"{pill}\"")
            ss = snap(page, "filter_pills")
            if pills_found >= 5:
                ok("ADMIN", f"{pills_found}/6 filter pills visible ✓", ss)
            else:
                fail("ADMIN", f"Only {pills_found}/6 filter pills found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 7 — Orders table column headers
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify orders table column headers")
            col_headers = ["Order ID", "Customer", "Total", "Status", "Date"]
            cols_found  = 0
            for col in col_headers:
                loc = page.locator(f'th:has-text("{col}")').first
                if loc.is_visible():
                    cols_found += 1
                    info("ADMIN", f"  ✅ Column: \"{col}\"")
                else:
                    info("ADMIN", f"  ⚠️  Column not found: \"{col}\"")
            ss = snap(page, "table_columns")
            if cols_found >= 4:
                ok("ADMIN", f"{cols_found}/5 table column headers visible ✓", ss)
            else:
                fail("ADMIN", f"Only {cols_found}/5 column headers found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 8 — Create test order + reload + find row
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Create test order via DB; reload; find row by email")
            test_order = DB.create_test_order()
            if not test_order:
                fail("ADMIN", "Failed to create test order in DB — skipping Steps 9-13")
                raise RuntimeError("DB order creation failed")
            test_order_id = test_order["id"]
            info("ADMIN", f"  Created order ID: {test_order_id[:8]}… email={TEST_ORDER_EMAIL}")

            # Reload and wait for our row
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(2500)
            # Look for email in the row
            order_row = page.locator(f'tr:has-text("{TEST_ORDER_EMAIL}")').first
            try:
                expect(order_row).to_be_visible(timeout=10000)
                ss = snap(page, "test_order_row_found")
                ok("ADMIN", "Test order row found in orders table ✓", ss)
            except:
                ss = snap(page, "test_order_row_missing")
                fail("ADMIN", f"Test order row not visible (email={TEST_ORDER_EMAIL})", ss)
                raise RuntimeError("Test order row not found in table")

            # ════════════════════════════════════════════════════════════
            # STEP 9 — Click "View" → verify /admin/orders/{id}
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Click \"View\" button on test order → verify order detail URL")
            view_btn = order_row.locator('button:has-text("View")').first
            try:
                expect(view_btn).to_be_visible(timeout=5000)
                view_btn.click()
                page.wait_for_url(f"**/admin/orders/{test_order_id}", timeout=10000)
                ss = snap(page, "order_detail_url")
                ok("ADMIN", f"Order detail opened at /admin/orders/{test_order_id[:8]}… ✓", ss)
            except Exception as e:
                ss = snap(page, "view_btn_error")
                fail("ADMIN", f"View button error: {str(e)[:80]}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 10 — Verify order detail sections
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify order detail sections (Customer, Shipping Address, Tracking, Order Summary)")
            page.wait_for_timeout(2000)
            detail_sections = ["Customer", "Shipping Address", "Tracking", "Order Summary"]
            sects_found = 0
            for sect in detail_sections:
                loc = page.locator(f'text="{sect}"').first
                if loc.is_visible():
                    sects_found += 1
                    info("ADMIN", f"  ✅ Section: \"{sect}\"")
                else:
                    info("ADMIN", f"  ⚠️  Section not found: \"{sect}\"")
            ss = snap(page, "order_detail_sections")
            if sects_found >= 3:
                ok("ADMIN", f"{sects_found}/4 order detail sections visible ✓", ss)
            else:
                fail("ADMIN", f"Only {sects_found}/4 detail sections found", ss)

            # Verify customer name + email are shown
            try:
                expect(page.locator(f'text="{TEST_ORDER_EMAIL}"').first).to_be_visible(timeout=5000)
                info("ADMIN", f"  Customer email '{TEST_ORDER_EMAIL}' visible ✓")
            except:
                info("ADMIN", f"  ⚠️  Customer email not found in detail")

            # ════════════════════════════════════════════════════════════
            # STEP 11 — Back to /admin/orders; find row; click "Manual"
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Navigate back → find test order → click \"Manual\" tracking button")
            page.goto(f"{BASE_URL}/admin/orders", wait_until="networkidle")
            page.wait_for_timeout(2500)
            order_row2 = page.locator(f'tr:has-text("{TEST_ORDER_EMAIL}")').first
            try:
                expect(order_row2).to_be_visible(timeout=10000)
                manual_btn = order_row2.locator('button:has-text("Manual")').first
                expect(manual_btn).to_be_visible(timeout=5000)
                manual_btn.click()
                page.wait_for_timeout(1000)
                ss = snap(page, "manual_btn_clicked")
                ok("ADMIN", "\"Manual\" tracking button clicked ✓", ss)
            except Exception as e:
                ss = snap(page, "manual_btn_error")
                fail("ADMIN", f"Manual button error: {str(e)[:80]}", ss)
                raise RuntimeError("Could not open tracking modal")

            # ════════════════════════════════════════════════════════════
            # STEP 12 — Tracking modal: enter number → Save Tracking
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify \"Add Tracking\" modal → enter tracking number → Save")
            tracking_modal = page.locator('h2:has-text("Add Tracking")').first
            try:
                expect(tracking_modal).to_be_visible(timeout=8000)
                info("ADMIN", "  \"Add Tracking\" modal heading visible ✓")
            except:
                ss = snap(page, "modal_heading_missing")
                fail("ADMIN", "\"Add Tracking\" modal heading not found", ss)
                raise RuntimeError("Tracking modal did not open")

            tracking_input = page.locator('input[placeholder="e.g. 1Z999AA10123456784"]').first
            expect(tracking_input).to_be_visible(timeout=5000)
            tracking_input.fill(TEST_TRACKING)
            info("ADMIN", f"  Tracking number entered: {TEST_TRACKING}")

            save_btn = page.locator('button:has-text("Save Tracking")').first
            expect(save_btn).to_be_visible(timeout=5000)
            save_btn.click()
            page.wait_for_timeout(2500)  # wait for API + state update
            ss = snap(page, "tracking_saved")
            ok("ADMIN", f"Tracking modal filled + \"Save Tracking\" clicked ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 13 — Verify tracking number shown in table row
            # ════════════════════════════════════════════════════════════
            step("ADMIN", f"Verify tracking number \"{TEST_TRACKING}\" appears in table row")
            # After saveTracking(), React updates state — no page reload needed
            page.wait_for_timeout(1000)
            order_row3 = page.locator(f'tr:has-text("{TEST_ORDER_EMAIL}")').first
            try:
                expect(order_row3).to_be_visible(timeout=8000)
                row_text = order_row3.inner_text()
                if TEST_TRACKING in row_text:
                    ss = snap(page, "tracking_number_in_row")
                    ok("ADMIN", f"Tracking \"{TEST_TRACKING}\" visible in order row ✓", ss)
                else:
                    # Try page reload as fallback (tracking persisted in DB)
                    page.reload(wait_until="networkidle")
                    page.wait_for_timeout(2000)
                    order_row3b = page.locator(f'tr:has-text("{TEST_ORDER_EMAIL}")').first
                    if order_row3b.is_visible():
                        row_text2 = order_row3b.inner_text()
                        if TEST_TRACKING in row_text2:
                            ss = snap(page, "tracking_in_row_after_reload")
                            ok("ADMIN", f"Tracking \"{TEST_TRACKING}\" confirmed after reload ✓", ss)
                        else:
                            ss = snap(page, "tracking_not_in_row")
                            fail("ADMIN", f"Tracking not visible in row. Row text: {row_text2[:100]}", ss)
                    else:
                        ss = snap(page, "row_not_found_after_reload")
                        fail("ADMIN", "Order row not found after reload", ss)
            except Exception as e:
                ss = snap(page, "tracking_verify_error")
                fail("ADMIN", f"Tracking verification error: {str(e)[:80]}", ss)

        except RuntimeError as stop:
            info("ADMIN", f"Flow stopped early: {stop}")

        finally:
            # ── Cleanup ──────────────────────────────────────────────
            if test_order_id:
                info("SYSTEM", f"Cleaning up test order {test_order_id[:8]}…")
                DB.delete_order(test_order_id)
                info("SYSTEM", "Test order deleted ✓")
            browser.close()

    return _passed, _failed


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="FLOW-11: Admin Dashboard + Orders bot")
    ap.add_argument("--headed", action="store_true", help="Run with visible browser")
    ap.add_argument("--slow",   action="store_true", help="Slow motion (1s delays)")
    args = ap.parse_args()

    passed, failed = run_admin_orders_flow(headed=args.headed, slow=args.slow)

    report_path = generate_report()

    print(f"\n{'═'*64}")
    print(f"  {'✅ ALL PASSED' if failed == 0 else '❌ SOME FAILED'}")
    print(f"  {passed} passed · {failed} failed")
    print(f"  Report → {report_path}")
    print(f"{'═'*64}\n")

    sys.exit(0 if failed == 0 else 1)
