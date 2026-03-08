#!/usr/bin/env python3
"""
E2E Order Lifecycle Bot — Krisha Sparkles (Playwright)
=====================================================
REAL browser automation. Every check verifies the ACTUAL SCREEN.
Generates a self-contained HTML report with embedded screenshots.

Usage:
  source .venv/bin/activate
  python e2e_order_bot.py                  # headless, production
  python e2e_order_bot.py --headed         # watch it live
  python e2e_order_bot.py --headed --slow  # slow motion (1s delays)
  BASE_URL=http://localhost:3000 python e2e_order_bot.py  # local

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEVELOPER CONTRACT — READ BEFORE ADDING NEW CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  RULE 1 — NEVER use substring matching for numeric values:
    ❌  if str(N) in page.inner_text()
    ❌  if str(N) in locator('text=...').locator('..').inner_text()
    ✅  use read_numeric_field(page, "testid-name", expected_value)

  RULE 2 — NEVER walk up to a parent container to read a value:
    ❌  locator('text="label"').locator('..')   # grabs ALL sibling text
    ✅  target the EXACT element via data-testid

  RULE 3 — Every page numeric you test MUST have a data-testid:
    Add  data-testid="your-field"  to the JSX element.
    Register it in SELECTOR_CONTRACT below.
    The pre-flight check will fail the run if it is missing from prod.

  RULE 4 — read_numeric_field() returns -1 on missing element:
    -1 is treated as ❌ FAIL — it NEVER silently passes.
    A missing data-testid surfaces immediately, not after a human
    stares at a screenshot wondering why the number looks wrong.

  WHY THESE RULES EXIST:
    In March 2026 the bot falsely passed a "500 pts" check because
    `str(500) in parent_text` matched "500 pts to Silver" (tier
    progress label) even though the actual balance was 0.
    The production DB was broken, the bot said ✅, nobody knew.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SELECTOR CONTRACT
# Every data-testid the bot depends on is registered here.
# The pre-flight check (PRE-FLIGHT 2) runs AFTER customer login
# so that auth-protected pages actually render their content.
# Adding a new check? Add its data-testid here too.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECTOR_CONTRACT = {
    # testid                page path (auth-protected — check runs post-login)
    "points-balance":       "/account/points",
}
# (add more rows as new data-testid attributes are added to the app)

import os, sys, uuid, math, argparse, time, base64
import requests as http_requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, expect
from admin_session import admin_login as _admin_login

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
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@krishasparkles.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@1234")
ADMIN_GATE     = os.getenv("ADMIN_GATE_TOKEN", "ks7f2m9p4n8x3b1qZA")

RUN_ID        = uuid.uuid4().hex[:8]
TEST_EMAIL    = f"e2e-bot-{RUN_ID}@test.krishasparkles.com"
TEST_PASSWORD = "BotTest@1234"

POINTS_TO_SEED   = 500
POINTS_TO_REDEEM = 300
STATUS_FLOW      = ["shipped", "delivered"]   # only what admin UI dropdown supports

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"e2e-{RUN_ID}"
REPORTS_DIR     = Path(__file__).resolve().parent / "reports"

# ── Result collector ──────────────────────────────────────────────────────────
RESULTS: list[dict] = []   # filled during run, used for HTML report
RUN_START = datetime.now()

def _record(actor: str, description: str, status: str,
            screenshot_path: str | None = None, note: str = ""):
    RESULTS.append({
        "n":          len(RESULTS) + 1,
        "actor":      actor,
        "description": description,
        "status":     status,          # "pass" | "fail" | "info" | "skip"
        "screenshot": screenshot_path,
        "note":       note,
        "ts":         datetime.now().strftime("%H:%M:%S"),
    })

# ── Console logging ───────────────────────────────────────────────────────────
R="\033[0m"; G="\033[92m"; B="\033[94m"; Y="\033[93m"
RED="\033[91m"; BOLD="\033[1m"; DIM="\033[2m"
_passed = 0; _failed = 0; _step = 0

def _c(a): return G if a=="CUSTOMER" else B if a=="ADMIN" else Y
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
    """Take screenshot, return absolute path string."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREENSHOTS_DIR / f"{_step:02d}_{name}.png"
    page.screenshot(path=str(path), full_page=False)
    info("SCREEN", f"📸 {path.name}")
    return str(path)

def read_numeric_field(page: Page, testid: str) -> int:
    """
    CANONICAL way to read any numeric value from the page.

    Targets [data-testid=<testid>] — one specific element, nothing else.
    Returns the integer value, or -1 if the element is missing/unreadable.
    -1 is an EXPLICIT FAILURE SIGNAL — callers must treat it as ❌.

    DO NOT bypass this with inner_text() + substring matching.
    See DEVELOPER CONTRACT at the top of this file.
    """
    el = page.locator(f'[data-testid="{testid}"]')
    try:
        el.wait_for(state="visible", timeout=8000)
        raw = el.text_content(timeout=5000) or ""
        return int(raw.replace(",", "").replace(" ", "").strip())
    except Exception as exc:
        info("SCREEN", f"⚠️  read_numeric_field('{testid}') failed: {exc}")
        return -1


def read_points_balance(page: Page) -> int:
    """Convenience wrapper — reads points-balance via the canonical helper."""
    return read_numeric_field(page, "points-balance")


def verify_numeric(actor: str, testid: str, expected: int,
                   page: Page, screenshot: str, label: str = "") -> bool:
    """
    Read a numeric field and immediately record pass/fail.
    Returns True on match, False on any mismatch or missing element.
    Use this for ALL numeric assertions in flows.
    """
    actual = read_numeric_field(page, testid)
    display = label or testid
    if actual == expected:
        ok(actor, f"{display}: {actual} ✓", screenshot)
        return True
    elif actual == -1:
        fail(actor,
             f"{display}: [data-testid='{testid}'] NOT FOUND on page "
             f"(expected {expected}) — check DB columns or data-testid in JSX",
             screenshot)
    else:
        fail(actor,
             f"{display} mismatch — screen shows {actual}, expected {expected}",
             screenshot)
    return False


# ── Supabase Direct (only for things with NO UI) ──────────────────────────────
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
    def seed_points(uid, pts):
        try:
            DB._r("PATCH","user_profiles",{"id":f"eq.{uid}"},
                  {"points_balance":pts,"lifetime_points":pts})
        except Exception:
            DB._r("PATCH","user_profiles",{"id":f"eq.{uid}"},{"points_balance":pts})

    @staticmethod
    def products(limit=10):
        return DB._r("GET","products",{
            "active":"eq.true","stock_quantity":"gt.0",
            "select":"id,name,slug,price,stock_quantity",
            "order":"created_at.desc","limit":str(limit)})

    @staticmethod
    def create_order(uid, email, product, pts_redeemed=0, pts_discount=0.0):
        price = product["price"]; total = round(price - pts_discount, 2)
        order = DB._r("POST","orders",data={
            "email":email,"name":f"E2E Bot {RUN_ID}","status":"paid",
            "subtotal":price,"tax":0,"total":total,"user_id":uid,
            "points_redeemed":pts_redeemed,
            "shipping_address":{"line1":"123 Test St","city":"Bettendorf",
                                "state":"IA","postal_code":"52722","country":"US"},
            "stripe_session_id":f"e2e_bot_{RUN_ID}",
            "stripe_payment_intent_id":f"pi_e2e_{RUN_ID}"})
        if isinstance(order,list): order=order[0]
        oid = order["id"]
        DB._r("POST","order_items",data={"order_id":oid,"product_id":product["id"],
              "product_name":product["name"],"quantity":1,"price":price})
        DB._r("PATCH","products",{"id":f"eq.{product['id']}"},
               {"stock_quantity":max(0,product["stock_quantity"]-1)})
        if pts_redeemed > 0:
            p = DB._r("GET","user_profiles",{"id":f"eq.{uid}","select":"points_balance"},single=True)
            DB._r("PATCH","user_profiles",{"id":f"eq.{uid}"},
                   {"points_balance":max(0,(p.get("points_balance") or 0)-pts_redeemed)})
        earned = math.floor(total)
        if earned > 0:
            p = DB._r("GET","user_profiles",{"id":f"eq.{uid}","select":"points_balance"},single=True)
            nb = (p.get("points_balance") or 0)+earned
            try:
                DB._r("PATCH","user_profiles",{"id":f"eq.{uid}"},
                       {"points_balance":nb,"lifetime_points":nb})
            except Exception:
                DB._r("PATCH","user_profiles",{"id":f"eq.{uid}"},{"points_balance":nb})
        return oid, total, earned

    @staticmethod
    def cleanup(uid, oid=None, pid=None, orig_stock=None):
        for fn in [
            lambda: DB._r("DELETE","order_items",{"order_id":f"eq.{oid}"}) if oid else None,
            lambda: DB._r("DELETE","orders",{"id":f"eq.{oid}"}) if oid else None,
            lambda: DB._r("PATCH","products",{"id":f"eq.{pid}"},{"stock_quantity":orig_stock}) if pid and orig_stock else None,
            lambda: DB._r("DELETE","user_profiles",{"id":f"eq.{uid}"}),
            lambda: http_requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
                     headers={"apikey":SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}"}),
        ]:
            try: fn()
            except Exception: pass


# ══════════════════════════════════════════════════════════════════════════════
# HTML REPORT GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
def _img_b64(path: str | None) -> str:
    """Encode screenshot to base64 data URI for embedding in HTML."""
    if not path: return ""
    try:
        with open(path, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except Exception:
        return ""

def generate_report(flow_name: str) -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f"report_{RUN_ID}_{ts}.html"

    total   = _passed + _failed
    pct     = int(100 * _passed / total) if total else 0
    elapsed = round((datetime.now() - RUN_START).total_seconds(), 1)

    actor_colors = {
        "CUSTOMER": ("#10b981", "#052e16"),
        "ADMIN":    ("#3b82f6", "#0c1a2e"),
        "SYSTEM":   ("#f59e0b", "#1c1400"),
        "SCREEN":   ("#6b7280", "#111"),
        "CLEANUP":  ("#8b5cf6", "#1a0a2e"),
    }
    status_icons = {"pass":"✅","fail":"❌","info":"ℹ️","skip":"⏭️"}

    # Build rows
    rows_html = ""
    for r in RESULTS:
        color, bg = actor_colors.get(r["actor"], ("#aaa","#1a1a1a"))
        icon = status_icons.get(r["status"], "•")
        row_bg = "#1a0a0a" if r["status"]=="fail" else "#0e1a10" if r["status"]=="pass" else "#111"
        img_html = ""
        if r["screenshot"] and r["status"] != "info":
            b64 = _img_b64(r["screenshot"])
            if b64:
                img_html = f"""
                <div style="margin-top:8px">
                  <img src="{b64}"
                       style="max-width:100%;border-radius:6px;border:1px solid #333;
                              cursor:pointer;transition:transform .2s"
                       onclick="this.style.transform=this.style.transform?'':'scale(2.5) translateX(-20%)'"
                       title="Click to zoom" />
                </div>"""
        note_html = f'<div style="color:#888;font-size:11px;margin-top:4px">{r["note"]}</div>' if r["note"] else ""
        rows_html += f"""
        <tr style="background:{row_bg};border-bottom:1px solid #1f1f1f">
          <td style="padding:10px 12px;color:#555;font-size:12px;white-space:nowrap;vertical-align:top">{r["n"]}</td>
          <td style="padding:10px 12px;vertical-align:top">
            <span style="background:{bg};color:{color};border:1px solid {color};
                         border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;
                         white-space:nowrap">{r["actor"]}</span>
          </td>
          <td style="padding:10px 12px;font-size:13px;vertical-align:top">
            {r["description"]}
            {note_html}
            {img_html}
          </td>
          <td style="padding:10px 12px;text-align:center;font-size:16px;vertical-align:top">{icon}</td>
          <td style="padding:10px 12px;color:#555;font-size:11px;white-space:nowrap;vertical-align:top">{r["ts"]}</td>
        </tr>"""

    # Summary bar
    bar_html = ""
    for r in RESULTS:
        col = "#10b981" if r["status"]=="pass" else "#ef4444" if r["status"]=="fail" else "#374151"
        bar_html += f'<div style="flex:1;height:6px;background:{col};min-width:2px"></div>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>E2E Report — {flow_name} — {RUN_ID}</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}}
  table{{width:100%;border-collapse:collapse}}
  th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;
      text-transform:uppercase;letter-spacing:.05em;color:#555;
      background:#0d0d0d;border-bottom:1px solid #1f1f1f}}
  tr:hover td{{filter:brightness(1.08)}}
  .pill{{display:inline-block;padding:3px 10px;border-radius:9999px;
         font-size:12px;font-weight:600}}
</style>
</head>
<body>
<!-- ── HEADER ───────────────────────────────────────────── -->
<div style="background:linear-gradient(135deg,#0f0800,#1a0f00);
            border-bottom:1px solid rgba(201,168,76,.3);padding:32px 40px 24px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#c9a84c,#f5d07a);
                border-radius:12px;display:flex;align-items:center;justify-content:center;
                font-size:24px">🤖</div>
    <div>
      <div style="font-size:20px;font-weight:700;color:#f5f5f5">{flow_name}</div>
      <div style="font-size:13px;color:#888;margin-top:2px">Krisha Sparkles — Playwright E2E</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:28px;font-weight:800;
                  color:{'#10b981' if _failed==0 else '#ef4444'}">
        {'ALL PASSED' if _failed==0 else f'{_failed} FAILED'}
      </div>
      <div style="font-size:13px;color:#888">{_passed} passed · {_failed} failed · {elapsed}s</div>
    </div>
  </div>

  <!-- Progress bar -->
  <div style="display:flex;gap:2px;border-radius:4px;overflow:hidden;margin-bottom:16px">
    {bar_html}
  </div>

  <!-- Meta grid -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
    {"".join(f'''<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
                             border-radius:8px;padding:10px 14px">
      <div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">{k}</div>
      <div style="font-size:13px;color:#ddd;word-break:break-all">{v}</div></div>'''
    for k,v in [
        ("Target", BASE_URL),
        ("Run ID", RUN_ID),
        ("Test user", TEST_EMAIL.split("@")[0]+"@..."),
        ("Date", RUN_START.strftime("%Y-%m-%d")),
        ("Time", RUN_START.strftime("%H:%M:%S")),
        ("Checks", f"{_passed+_failed} total · {pct}% passed"),
    ])}
  </div>
</div>

<!-- ── SUMMARY CARDS ─────────────────────────────────────── -->
<div style="display:flex;gap:12px;padding:24px 40px;flex-wrap:wrap">
  {''.join(f'''<div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;
                           padding:16px 24px;min-width:120px;text-align:center">
    <div style="font-size:28px;font-weight:700;color:{c}">{n}</div>
    <div style="font-size:12px;color:#555;margin-top:4px">{label}</div>
  </div>'''
  for n,label,c in [
      (_passed,"Passed","#10b981"),
      (_failed,"Failed","#ef4444"),
      (len(RESULTS),"Total Steps","#c9a84c"),
      (sum(1 for r in RESULTS if r["screenshot"] and r["status"]!="info"),"Screenshots","#3b82f6"),
  ])}
</div>

<!-- ── STEPS TABLE ───────────────────────────────────────── -->
<div style="padding:0 40px 40px">
  <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden">
    <table>
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th style="width:110px">Actor</th>
          <th>Description / Screenshot</th>
          <th style="width:50px">Status</th>
          <th style="width:70px">Time</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>
  </div>
</div>

<!-- ── FOOTER ───────────────────────────────────────────── -->
<div style="padding:16px 40px 32px;color:#333;font-size:12px;text-align:center;
            border-top:1px solid #111">
  Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · Run ID: {RUN_ID} · Krisha Sparkles E2E Bot
</div>
</body>
</html>"""

    report_path.write_text(html, encoding="utf-8")
    return str(report_path)


# ══════════════════════════════════════════════════════════════════════════════
# FLOW 1: Order Lifecycle (Login → Browse → Cart → Order → Status → Delivered)
# ══════════════════════════════════════════════════════════════════════════════
def run_order_lifecycle(headed=False, slow=False):
    global _passed, _failed, _step
    _passed=0; _failed=0; _step=0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  🤖 FLOW 1: Order Lifecycle — Krisha Sparkles{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target:  {BASE_URL}")
    print(f"  User:    {TEST_EMAIL}")
    print(f"  Mode:    {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"  Run ID:  {RUN_ID}")
    print(f"  Time:    {RUN_START.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'─'*64}\n")

    uid=None; oid=None; product=None; orig_stock=None

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=not headed,
            slow_mo=1000 if slow else (300 if headed else 50),
        )
        cust_ctx  = browser.new_context(viewport={"width":1280,"height":800})
        admin_ctx = browser.new_context(viewport={"width":1280,"height":800})
        cust  = cust_ctx.new_page()
        admin = admin_ctx.new_page()

        try:
            # ── PRE-FLIGHT 1: decline cookies so banner never blocks clicks ──
            for pg, label in [(cust,"Customer"),(admin,"Admin")]:
                pg.goto(f"{BASE_URL}/auth/login", wait_until="domcontentloaded")
                pg.evaluate('localStorage.setItem("ks_cookie_consent","declined")')
                info("SYSTEM", f"{label} browser: cookie consent pre-declined")

            # ════════════════════════════════════════════════════════
            # PHASE 1 — Create test user (API — email verify skip)
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", f"Creating account: {TEST_EMAIL}")
            uid = DB.create_user(TEST_EMAIL, TEST_PASSWORD)
            ok("CUSTOMER", f"Account created in Supabase — {uid[:12]}...")
            time.sleep(1.5)

            # ════════════════════════════════════════════════════════
            # PHASE 2 — Customer logs in via real browser form
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "Login via browser form")
            cust.goto(f"{BASE_URL}/auth/login", wait_until="networkidle")
            expect(cust.locator('h1:has-text("Welcome Back")')).to_be_visible(timeout=10000)
            cust.fill('input[placeholder="priya@example.com"]', TEST_EMAIL)
            cust.fill('input[placeholder="Your password"]', TEST_PASSWORD)
            ss = snap(cust, "login_form")
            cust.click('button[type="submit"]')
            expect(cust.locator('button[aria-label="Account menu"]')).to_be_visible(timeout=15000)
            ss = snap(cust, "logged_in")
            ok("CUSTOMER", "Logged in — avatar button visible in navbar", ss)

            # ── PRE-FLIGHT 2: SELECTOR CONTRACT CHECK (runs AFTER login) ──────
            # IMPORTANT: must run after login because all entries in
            # SELECTOR_CONTRACT point to auth-protected pages.
            # Visiting them unauthenticated just redirects to /auth/login
            # and the elements never render — the check would always fail.
            info("SYSTEM", f"Verifying selector contract ({len(SELECTOR_CONTRACT)} testids)...")
            contract_failures = []
            for testid, page_path in SELECTOR_CONTRACT.items():
                cust.goto(f"{BASE_URL}{page_path}", wait_until="networkidle")
                cust.wait_for_timeout(1500)
                el = cust.locator(f'[data-testid="{testid}"]')
                if el.count() > 0 and el.first.is_visible():
                    info("SYSTEM", f"  ✅ data-testid='{testid}' found on {page_path}")
                else:
                    contract_failures.append(testid)
                    info("SYSTEM", f"  ❌ data-testid='{testid}' MISSING on {page_path}")
            if contract_failures:
                ss = snap(cust, "contract_failure")
                raise RuntimeError(
                    f"SELECTOR CONTRACT FAILED — these data-testid attributes are missing "
                    f"from the live page: {contract_failures}\n"
                    f"Fix: add data-testid='...' to the JSX and redeploy, OR check DB columns."
                )

            # ════════════════════════════════════════════════════════
            # PHASE 3 — Customer checks initial points
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "Check initial points balance")
            cust.goto(f"{BASE_URL}/account/points", wait_until="networkidle")
            expect(cust.locator('text="points available"')).to_be_visible(timeout=10000)
            ss = snap(cust, "points_zero")
            ok("CUSTOMER", "Points page loaded — initial balance visible", ss)

            # ════════════════════════════════════════════════════════
            # PHASE 4 — Admin logs in via real browser form
            # ════════════════════════════════════════════════════════
            step("ADMIN", "Pass admin gate + login")
            _admin_login(admin_ctx, admin, BASE_URL, ADMIN_GATE, ADMIN_EMAIL, ADMIN_PASSWORD)
            ss = snap(admin, "admin_dashboard")
            ok("ADMIN", "Logged in — dashboard visible", ss)

            # ════════════════════════════════════════════════════════
            # PHASE 5 — Admin seeds loyalty points
            # ════════════════════════════════════════════════════════
            step("ADMIN", f"Seed {POINTS_TO_SEED} loyalty points")
            DB.seed_points(uid, POINTS_TO_SEED)
            ok("ADMIN", f"Points seeded: {POINTS_TO_SEED}")

            step("CUSTOMER", "Verify seeded points on screen")
            cust.goto(f"{BASE_URL}/account/points", wait_until="networkidle")
            cust.wait_for_timeout(2000)
            ss = snap(cust, "points_seeded")
            verify_numeric("CUSTOMER", "points-balance", POINTS_TO_SEED, cust, ss,
                           label=f"Seeded balance ({POINTS_TO_SEED} pts)")

            # ════════════════════════════════════════════════════════
            # PHASE 6 — Customer browses shop
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "Browse /shop page")
            cust.goto(f"{BASE_URL}/shop", wait_until="networkidle")
            cust.wait_for_timeout(2000)
            product_links = cust.locator('a[href^="/shop/"]')
            expect(product_links.first).to_be_visible(timeout=15000)
            count = product_links.count()
            ss = snap(cust, "shop")
            ok("CUSTOMER", f"Shop loaded — {count} products visible on screen", ss)

            products = DB.products(limit=5)
            product = products[0]
            orig_stock = product["stock_quantity"]

            # ════════════════════════════════════════════════════════
            # PHASE 7 — Customer views product detail
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", f"Open product: \"{product['name']}\"")
            cust.goto(f"{BASE_URL}/shop/{product['slug']}", wait_until="networkidle")
            cust.wait_for_timeout(2000)
            h1 = cust.locator('h1').first
            expect(h1).to_be_visible(timeout=10000)
            page_name = h1.text_content().strip()
            ss = snap(cust, "product_detail")
            ok("CUSTOMER", f"Product detail loaded: \"{page_name}\"", ss)

            # ════════════════════════════════════════════════════════
            # PHASE 8 — Customer adds product to cart
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "Click 'Add to Cart'")
            add_btn = cust.locator('button:has-text("Add to Cart")')
            if add_btn.count() > 0 and add_btn.first.is_visible():
                add_btn.first.click()
                expect(cust.locator('.cart-drawer')).to_be_visible(timeout=5000)
                ss = snap(cust, "cart_open")
                ok("CUSTOMER", "Cart drawer opened — product added", ss)
                # Close cart via overlay
                overlay = cust.locator('.cart-overlay')
                if overlay.count() > 0 and overlay.first.is_visible():
                    overlay.first.click(force=True)
                else:
                    cust.keyboard.press("Escape")
                cust.wait_for_timeout(800)
            else:
                ss = snap(cust, "no_add_to_cart")
                fail("CUSTOMER", "\"Add to Cart\" button NOT visible on screen", ss)

            # ════════════════════════════════════════════════════════
            # PHASE 9 — Create order (simulates Stripe webhook)
            # ════════════════════════════════════════════════════════
            discount = POINTS_TO_REDEEM / 100
            step("ADMIN", "Create order via DB (Stripe simulation)")
            oid, total, earned = DB.create_order(
                uid, TEST_EMAIL, product, POINTS_TO_REDEEM, discount)
            oid_admin    = oid[:8]               # first 8 — shown in admin table
            oid_customer = oid[-8:].upper()      # last 8  — shown on customer page
            ok("ADMIN", f"Order #{oid_admin} created — ${total:.2f} (pts redeemed:{POINTS_TO_REDEEM}, earned:{earned})")

            # ════════════════════════════════════════════════════════
            # PHASE 10 — Customer sees order on screen
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "My Orders page — verify order visible")
            cust.goto(f"{BASE_URL}/account/orders", wait_until="networkidle")
            cust.wait_for_timeout(2000)
            expect(cust.locator(f'text="Order #{oid_customer}"').first).to_be_visible(timeout=10000)
            card = cust.locator(f'a:has-text("{oid_customer}")').first
            card_text = card.inner_text()
            ss = snap(cust, "order_paid")
            if "paid" in card_text.lower():
                ok("CUSTOMER", f"Order #{oid_customer} visible — status \"paid\" on screen", ss)
            else:
                fail("CUSTOMER", f'"paid" not in card text: {card_text[:60]}', ss)

            # ════════════════════════════════════════════════════════
            # PHASE 11 — Admin sees order in table
            # ════════════════════════════════════════════════════════
            step("ADMIN", "Admin orders page — find order in table")
            admin.goto(f"{BASE_URL}/admin/orders", wait_until="networkidle")
            admin.wait_for_timeout(3000)
            expect(admin.locator(f'tr:has-text("{oid_admin}")').first).to_be_visible(timeout=10000)
            ss = snap(admin, "admin_orders")
            ok("ADMIN", f"Order #{oid_admin} visible in admin table", ss)

            # ════════════════════════════════════════════════════════
            # PHASE 12-N — Status progression via admin UI dropdown
            # ════════════════════════════════════════════════════════
            for new_status in STATUS_FLOW:
                step("ADMIN", f"Change status → \"{new_status}\" via dropdown")
                admin.goto(f"{BASE_URL}/admin/orders", wait_until="networkidle")
                admin.wait_for_timeout(2000)
                row = admin.locator(f'tr:has-text("{oid_admin}")').first
                expect(row).to_be_visible(timeout=10000)
                sel = row.locator('select')
                expect(sel).to_be_visible(timeout=5000)
                old_val = sel.input_value()
                sel.select_option(new_status)
                admin.wait_for_timeout(2500)
                ss = snap(admin, f"admin_{new_status}")
                new_val = sel.input_value()
                if new_val == new_status:
                    ok("ADMIN", f"Dropdown: \"{old_val}\" → \"{new_status}\" ✓", ss)
                else:
                    fail("ADMIN", f"Dropdown shows \"{new_val}\", expected \"{new_status}\"", ss)

                step("CUSTOMER", f"Verify status = \"{new_status}\" on screen")
                cust.goto(f"{BASE_URL}/account/orders", wait_until="networkidle")
                cust.wait_for_timeout(2000)
                card = cust.locator(f'a:has-text("{oid_customer}")').first
                expect(card).to_be_visible(timeout=10000)
                card_text = card.inner_text()
                ss = snap(cust, f"customer_{new_status}")
                if new_status in card_text.lower():
                    ok("CUSTOMER", f"Screen shows \"{new_status}\" on order card ✓", ss)
                else:
                    fail("CUSTOMER", f'"{new_status}" not on screen. Got: {card_text[:60]}', ss)

            # ════════════════════════════════════════════════════════
            # PHASE FINAL — Points check + admin screenshot
            # ════════════════════════════════════════════════════════
            step("CUSTOMER", "Final points balance")
            cust.goto(f"{BASE_URL}/account/points", wait_until="networkidle")
            cust.wait_for_timeout(2000)
            expected_final = POINTS_TO_SEED - POINTS_TO_REDEEM + earned
            ss = snap(cust, "points_final")
            verify_numeric("CUSTOMER", "points-balance", expected_final, cust, ss,
                           label=f"Final balance (seed {POINTS_TO_SEED} − redeem {POINTS_TO_REDEEM} + earned {earned})")

            step("ADMIN", "Final admin state")
            admin.goto(f"{BASE_URL}/admin/orders", wait_until="networkidle")
            admin.wait_for_timeout(2000)
            ss = snap(admin, "admin_final")
            ok("ADMIN", "Final admin orders captured", ss)

        except Exception as e:
            fail("SYSTEM", f"FATAL: {e}")
            import traceback; traceback.print_exc()
            try:
                snap(cust,  "error_customer")
                snap(admin, "error_admin")
            except Exception: pass
        finally:
            print(f"\n{'─'*64}")
            step("CLEANUP", "Removing all test data")
            DB.cleanup(uid, oid, product["id"] if product else None, orig_stock)
            ok("CLEANUP", "Test user, order, and order items deleted")
            cust_ctx.close()
            admin_ctx.close()
            browser.close()

    return _passed, _failed


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Krisha Sparkles E2E Bot")
    parser.add_argument("--headed", action="store_true", help="Show browser windows")
    parser.add_argument("--slow",   action="store_true", help="Slow motion (1s delays)")
    args = parser.parse_args()

    passed, failed = run_order_lifecycle(headed=args.headed, slow=args.slow)

    # ── Generate HTML report ──────────────────────────────────────────────────
    print(f"\n{'─'*64}")
    report_file = generate_report("Flow 1: Order Lifecycle")
    print(f"\n{BOLD}{'═'*64}{R}")
    if failed == 0:
        print(f"{G}{BOLD}  ✅ ALL {passed} CHECKS PASSED{R}")
    else:
        print(f"{RED}{BOLD}  ❌ {failed} FAILED, {passed} PASSED{R}")
    print(f"{BOLD}  📸 Screenshots : {SCREENSHOTS_DIR}{R}")
    print(f"{BOLD}  📄 HTML Report : {report_file}{R}")
    print(f"{BOLD}{'═'*64}{R}\n")

    sys.exit(0 if failed == 0 else 1)
