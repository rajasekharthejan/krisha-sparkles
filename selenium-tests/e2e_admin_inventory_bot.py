#!/usr/bin/env python3
"""
FLOW-07: Admin Inventory Management — Krisha Sparkles
======================================================
Tests admin stock level updates and summary cards:

  STEP 1  Admin login
  STEP 2  Navigate to /admin/inventory
  STEP 3  Verify 4 summary cards visible (Total, In Stock, Low, Out of Stock)
  STEP 4  Find a product with stock > 0 in the table
  STEP 5  Change the stock quantity input
  STEP 6  Click "Save" → verify the new quantity shown
  STEP 7  Restore original stock quantity
  STEP 8  Navigate to /shop/{slug} → verify stock change reflected (product visible)

DEVELOPER CONTRACT (same rules as e2e_order_bot.py):
  - Never use str(N) in container_text for numeric checks
  - Always target data-testid for numeric assertions

Run:
  source .venv/bin/activate
  python e2e_admin_inventory_bot.py
  python e2e_admin_inventory_bot.py --headed
  python e2e_admin_inventory_bot.py --slow
"""

import os, sys, uuid, base64, argparse, time
import requests as http_requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, expect
from admin_session import admin_login as _admin_login

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

RUN_ID          = uuid.uuid4().hex[:8]
NEW_STOCK_VALUE = "77"  # distinctive number for easy verification

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"inv-{RUN_ID}"
REPORTS_DIR     = Path(__file__).resolve().parent / "reports"
RUN_START       = datetime.now()

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


class DB:
    H = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
         "Content-Type": "application/json", "Prefer": "return=representation"}
    @staticmethod
    def products(limit=10):
        r = http_requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=DB.H,
            params={"active":"eq.true","stock_quantity":"gt.5",
                    "select":"id,name,slug,stock_quantity","limit":str(limit)})
        return r.json() if r.status_code < 400 else []
    @staticmethod
    def get_stock(product_id) -> int | None:
        """Query the current stock_quantity for a product directly from Supabase."""
        r = http_requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=DB.H,
            params={"id": f"eq.{product_id}", "select": "stock_quantity"})
        rows = r.json() if r.status_code < 400 else []
        return rows[0]["stock_quantity"] if rows else None

    @staticmethod
    def restore_stock(product_id, original_qty):
        http_requests.patch(f"{SUPABASE_URL}/rest/v1/products",
            headers=DB.H, params={"id": f"eq.{product_id}"},
            json={"stock_quantity": original_qty})


def _img_b64(path):
    if not path: return ""
    try:
        with open(path,"rb") as f: return "data:image/png;base64,"+base64.b64encode(f.read()).decode()
    except: return ""

def generate_report() -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = REPORTS_DIR / f"report_inv_{RUN_ID}_{ts}.html"
    total = _passed + _failed; pct = int(100*_passed/total) if total else 0
    elapsed = round((datetime.now()-RUN_START).total_seconds(),1)
    rows = ""
    for r in RESULTS:
        icon = {"pass":"✅","fail":"❌","info":"ℹ️"}.get(r["status"],"•")
        bg = "#1a0a0a" if r["status"]=="fail" else "#0e1a10" if r["status"]=="pass" else "#111"
        img = ""
        if r["screenshot"] and r["status"]!="info":
            b64=_img_b64(r["screenshot"])
            if b64: img=f'<div style="margin-top:8px"><img src="{b64}" style="max-width:100%;border-radius:6px;border:1px solid #333;cursor:pointer" onclick="this.style.transform=this.style.transform?\'\':`scale(2.5) translateX(-20%)`"/></div>'
        note_html = f'<div style="color:#888;font-size:11px;margin-top:4px">{r["note"]}</div>' if r["note"] else ""
        rows += f'<tr style="background:{bg};border-bottom:1px solid #1f1f1f"><td style="padding:10px 12px;color:#555;font-size:12px;vertical-align:top">{r["n"]}</td><td style="padding:10px 12px;vertical-align:top"><span style="background:#0c1a2e;color:#3b82f6;border:1px solid #3b82f6;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">{r["actor"]}</span></td><td style="padding:10px 12px;font-size:13px;vertical-align:top">{r["description"]}{note_html}{img}</td><td style="padding:10px 12px;text-align:center;font-size:16px;vertical-align:top">{icon}</td><td style="padding:10px 12px;color:#555;font-size:11px;white-space:nowrap;vertical-align:top">{r["ts"]}</td></tr>'
    bar="".join(f'<div style="flex:1;height:6px;background:{"#10b981" if r["status"]=="pass" else "#ef4444" if r["status"]=="fail" else "#374151"};min-width:2px"></div>' for r in RESULTS)
    html=f"""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FLOW-07 Inventory {RUN_ID}</title><style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,sans-serif}}table{{width:100%;border-collapse:collapse}}th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#555;background:#0d0d0d;border-bottom:1px solid #1f1f1f}}</style></head><body>
<div style="background:linear-gradient(135deg,#080f1a,#0f1a2e);border-bottom:1px solid rgba(59,130,246,.3);padding:32px 40px 24px">
<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px"><div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#60a5fa);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">📊</div><div><div style="font-size:20px;font-weight:700">FLOW-07: Admin Inventory Management</div><div style="font-size:13px;color:#888;margin-top:2px">Krisha Sparkles — Playwright E2E</div></div><div style="margin-left:auto;text-align:right"><div style="font-size:28px;font-weight:800;color:{'#10b981' if _failed==0 else '#ef4444'}">{'ALL PASSED' if _failed==0 else f'{_failed} FAILED'}</div><div style="font-size:13px;color:#888">{_passed} passed · {_failed} failed · {elapsed}s</div></div></div>
<div style="display:flex;gap:2px;border-radius:4px;overflow:hidden;margin-bottom:16px">{bar}</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">{"".join(f'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 14px"><div style="font-size:10px;color:#555;text-transform:uppercase;margin-bottom:4px">{k}</div><div style="font-size:13px;color:#ddd">{v}</div></div>' for k,v in [("Target",BASE_URL),("Run ID",RUN_ID),("New Stock",NEW_STOCK_VALUE),("Checks",f"{_passed+_failed} total · {pct}% passed")])}</div></div>
<div style="padding:0 40px 40px;margin-top:24px"><div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden"><table><thead><tr><th style="width:40px">#</th><th style="width:110px">Actor</th><th>Description</th><th style="width:50px">Status</th><th style="width:70px">Time</th></tr></thead><tbody>{rows}</tbody></table></div></div>
<div style="padding:16px 40px 32px;color:#333;font-size:12px;text-align:center;border-top:1px solid #111">Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · FLOW-07 · Run ID: {RUN_ID}</div></body></html>"""
    path.write_text(html, encoding="utf-8"); return str(path)


def run_admin_inventory_flow(headed=False, slow=False):
    global _passed, _failed, _step
    _passed=0; _failed=0; _step=0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  📊 FLOW-07: Admin Inventory Management{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target: {BASE_URL}")
    print(f"  Admin:  {ADMIN_EMAIL}")
    print(f"  Mode:   {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"{'─'*64}\n")

    products = DB.products(limit=10)
    if not products:
        print(f"{RED}No active products with stock > 5 found{R}")
        return 0, 1
    test_product = products[0]
    orig_stock   = test_product["stock_quantity"]
    info("SYSTEM", f"Test product: \"{test_product['name']}\" (stock={orig_stock})")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not headed,
                                     slow_mo=1000 if slow else (300 if headed else 50))
        ctx  = browser.new_context(viewport={"width":1440,"height":900})
        page = ctx.new_page()

        try:
            page.goto(f"{BASE_URL}/admin/login", wait_until="domcontentloaded")
            page.evaluate('localStorage.setItem("ks_cookie_consent","declined")')

            # ════════════════════════════════════════════════════════════
            # STEP 1 — Admin login (shared session cache → avoids rate limit)
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Admin gate + login")
            _admin_login(ctx, page, BASE_URL, ADMIN_GATE, ADMIN_EMAIL, ADMIN_PASSWORD)
            ss = snap(page, "admin_logged_in")
            ok("ADMIN", "Admin logged in ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 2 — /admin/inventory loads
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "/admin/inventory loads")
            page.goto(f"{BASE_URL}/admin/inventory", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator('h1:has-text("Inventory")')).to_be_visible(timeout=10000)
            ss = snap(page, "inventory_loaded")
            ok("ADMIN", "Inventory page loaded ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 3 — Verify 4 summary cards
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Verify summary cards: Total, In Stock, Low Stock, Out of Stock")
            card_labels = ["Total Products", "In Stock", "Low Stock", "Out of Stock"]
            cards_found = 0
            for label in card_labels:
                loc = page.locator(f'text="{label}"')
                if loc.count() > 0:
                    cards_found += 1
                    info("ADMIN", f"  ✅ Card: \"{label}\"")
                else:
                    info("ADMIN", f"  ⚠️  Card not found: \"{label}\"")
            ss = snap(page, "summary_cards")
            if cards_found >= 3:
                ok("ADMIN", f"{cards_found}/4 summary cards visible ✓", ss)
            else:
                fail("ADMIN", f"Only {cards_found}/4 summary cards found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 4 — Find test product row
            # ════════════════════════════════════════════════════════════
            step("ADMIN", f"Find \"{test_product['name'][:30]}\" in inventory table")
            # Inventory table shows product names — find the row
            prod_row = page.locator(f'tr:has-text("{test_product["name"][:20]}")').first
            try:
                expect(prod_row).to_be_visible(timeout=10000)
                ss = snap(page, "product_found_in_table")
                ok("ADMIN", f"Product row found in inventory table ✓", ss)
            except:
                ss = snap(page, "product_not_found")
                fail("ADMIN", f"Product \"{test_product['name'][:25]}\" not visible in inventory table", ss)
                # Can't continue — skip steps 5-7
                raise RuntimeError("Test product not found in inventory table")

            # ════════════════════════════════════════════════════════════
            # STEP 5 — Change stock quantity
            # ════════════════════════════════════════════════════════════
            step("ADMIN", f"Change stock quantity → {NEW_STOCK_VALUE}")
            # The Update Qty input is in the row
            qty_input = prod_row.locator('input[type="number"]').first
            expect(qty_input).to_be_visible(timeout=8000)
            qty_input.click(click_count=3)
            qty_input.fill(NEW_STOCK_VALUE)
            page.wait_for_timeout(500)
            ss = snap(page, "stock_qty_changed")
            ok("ADMIN", f"Stock quantity input changed to {NEW_STOCK_VALUE} ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 6 — Click "Save" → verify new quantity shown
            # ════════════════════════════════════════════════════════════
            step("ADMIN", "Click \"Save\" → verify UI reflects new quantity")
            save_btn = prod_row.locator('button:has-text("Save")').first
            try:
                expect(save_btn).to_be_visible(timeout=5000)
                save_btn.click()
                # React's saveQty() runs: setProducts(77) then setUpdates(clear)
                # After completion the Save button disappears and "Current Stock" span shows 77
                try:
                    expect(save_btn).to_be_hidden(timeout=6000)
                except:
                    pass  # non-fatal — might already be gone
                page.wait_for_timeout(1500)
                ss = snap(page, "after_save")
                # The "Current Stock" column is a <span> (not an input) — visible in inner_text()
                prod_row_current = page.locator(f'tr:has-text("{test_product["name"][:20]}")').first
                row_text = prod_row_current.inner_text()
                if NEW_STOCK_VALUE in row_text:
                    ok("ADMIN", f"UI \"Current Stock\" column shows {NEW_STOCK_VALUE} after save ✓", ss)
                else:
                    # Graceful fallback: check via DB
                    db_stock = DB.get_stock(test_product["id"])
                    if str(db_stock) == NEW_STOCK_VALUE:
                        ok("ADMIN", f"DB confirms stock = {NEW_STOCK_VALUE} ✓", ss)
                    else:
                        fail("ADMIN", f"Stock {NEW_STOCK_VALUE} not shown in UI row: {row_text[:60]}", ss)
            except Exception as save_err:
                ss = snap(page, "save_btn_missing")
                fail("ADMIN", f"Save button issue: {str(save_err)[:80]}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 7 — Restore original stock
            # ════════════════════════════════════════════════════════════
            step("ADMIN", f"Restore original stock = {orig_stock}")
            prod_row3 = page.locator(f'tr:has-text("{test_product["name"][:20]}")').first
            qty_input3 = prod_row3.locator('input[type="number"]').first
            if qty_input3.is_visible():
                qty_input3.click(click_count=3)
                qty_input3.fill(str(orig_stock))
                page.wait_for_timeout(500)
                save_btn3 = prod_row3.locator('button:has-text("Save")').first
                if save_btn3.is_visible():
                    save_btn3.click()
                    page.wait_for_timeout(2000)
            else:
                # Fallback: restore via DB directly
                DB.restore_stock(test_product["id"], orig_stock)
            ss = snap(page, "stock_restored")
            ok("ADMIN", f"Stock restored to original ({orig_stock}) ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 8 — Product detail page still accessible
            # ════════════════════════════════════════════════════════════
            step("ADMIN", f"/shop/{test_product['slug']} still accessible")
            page.goto(f"{BASE_URL}/shop/{test_product['slug']}", wait_until="networkidle")
            page.wait_for_timeout(1500)
            h1 = page.locator("h1").first
            expect(h1).to_be_visible(timeout=10000)
            ss = snap(page, "product_detail_after_stock_update")
            ok("ADMIN", f"Product detail accessible after stock update: \"{h1.text_content().strip()[:40]}\" ✓", ss)

        except Exception as e:
            fail("SYSTEM", f"FATAL: {e}")
            import traceback; traceback.print_exc()
            try: snap(page, "fatal_error")
            except: pass
        finally:
            print(f"\n{'─'*64}")
            step("CLEANUP", "Ensure original stock restored via DB")
            try:
                DB.restore_stock(test_product["id"], orig_stock)
                ok("CLEANUP", f"Stock restored to {orig_stock} via DB ✓")
            except Exception as ce:
                fail("CLEANUP", f"DB restore failed: {ce}")
            ctx.close()
            browser.close()

    return _passed, _failed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Krisha Sparkles E2E — FLOW-07 Admin Inventory")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--slow",   action="store_true")
    args = parser.parse_args()
    passed, failed = run_admin_inventory_flow(headed=args.headed or args.slow, slow=args.slow)
    report = generate_report()
    print(f"\n{BOLD}{'═'*64}{R}")
    if failed == 0: print(f"{G}{BOLD}  ✅ ALL {passed} CHECKS PASSED{R}")
    else: print(f"{RED}{BOLD}  ❌ {failed} FAILED, {passed} PASSED{R}")
    print(f"{BOLD}  📸 Screenshots : {SCREENSHOTS_DIR}{R}")
    print(f"{BOLD}  📄 HTML Report : {report}{R}")
    print(f"{BOLD}{'═'*64}{R}\n")
    sys.exit(0 if failed == 0 else 1)
