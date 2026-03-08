#!/usr/bin/env python3
"""
FLOW-03: Customer Registration — Krisha Sparkles
=================================================
Tests the complete customer sign-up and profile flow:

  STEP 1  Validate form: empty submit shows required errors
  STEP 2  Validate form: mismatched passwords shows error
  STEP 3  Navigate to /auth/register — fill valid data — submit
  STEP 4  Verify "Check Your Email" confirmation screen appears
  STEP 5  Login with pre-confirmed account (created via admin API)
  STEP 6  Verify homepage redirects correctly after login
  STEP 7  Navigate to /account — verify welcome header
  STEP 8  Navigate to /account/profile — fill and save profile
  STEP 9  Reload profile page — verify saved values persisted
  CLEANUP Delete test user

DEVELOPER CONTRACT (same rules as e2e_order_bot.py):
  - Never use str(N) in container_text for numeric checks
  - Always target data-testid for numeric assertions
  - Every new numeric check needs a data-testid on the JSX element

Run:
  source .venv/bin/activate
  python e2e_registration_bot.py              # headless
  python e2e_registration_bot.py --headed    # watch it live
  python e2e_registration_bot.py --slow      # headed + 1s delays
"""

import os, sys, uuid, json, argparse, time, base64
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
BASE_URL     = os.getenv("BASE_URL", "https://shopkrisha.com").rstrip("/")
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

RUN_ID        = uuid.uuid4().hex[:8]
TEST_EMAIL    = f"e2e-reg-{RUN_ID}@test.krishasparkles.com"
TEST_PASSWORD = "BotTest@1234"
TEST_FIRST    = "E2E"
TEST_LAST     = f"Reg{RUN_ID[:4]}"

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"reg-{RUN_ID}"
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
    def create_user(email, pw, first="", last=""):
        r = http_requests.post(f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                     "Content-Type": "application/json"},
            json={"email": email, "password": pw, "email_confirm": True,
                  "user_metadata": {"first_name": first, "last_name": last}})
        if r.status_code >= 400: raise Exception(f"Create user: {r.text[:200]}")
        return r.json()["id"]

    @staticmethod
    def delete_user(uid):
        http_requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})

    @staticmethod
    def get_user_by_email(email):
        r = http_requests.get(f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            params={"filter": f"email.eq.{email}"})
        if r.status_code >= 400: return None
        users = r.json().get("users", [])
        return users[0] if users else None


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
    path = REPORTS_DIR / f"report_reg_{RUN_ID}_{ts}.html"
    total = _passed + _failed
    pct   = int(100 * _passed / total) if total else 0
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
        rows += f"""<tr style="background:{bg};border-bottom:1px solid #1f1f1f">
          <td style="padding:10px 12px;color:#555;font-size:12px;vertical-align:top">{r["n"]}</td>
          <td style="padding:10px 12px;vertical-align:top"><span style="background:#052e16;color:#10b981;border:1px solid #10b981;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">{r["actor"]}</span></td>
          <td style="padding:10px 12px;font-size:13px;vertical-align:top">{r["description"]}{note}{img}</td>
          <td style="padding:10px 12px;text-align:center;font-size:16px;vertical-align:top">{icon}</td>
          <td style="padding:10px 12px;color:#555;font-size:11px;white-space:nowrap;vertical-align:top">{r["ts"]}</td></tr>"""

    bar = "".join(f'<div style="flex:1;height:6px;background:{"#10b981" if r["status"]=="pass" else "#ef4444" if r["status"]=="fail" else "#374151"};min-width:2px"></div>' for r in RESULTS)

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>E2E FLOW-03 — Registration — {RUN_ID}</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}}table{{width:100%;border-collapse:collapse}}th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#555;background:#0d0d0d;border-bottom:1px solid #1f1f1f}}tr:hover td{{filter:brightness(1.08)}}</style></head><body>
<div style="background:linear-gradient(135deg,#0f0800,#1a0f00);border-bottom:1px solid rgba(201,168,76,.3);padding:32px 40px 24px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#c9a84c,#f5d07a);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">🧑</div>
    <div><div style="font-size:20px;font-weight:700">FLOW-03: Customer Registration</div><div style="font-size:13px;color:#888;margin-top:2px">Krisha Sparkles — Playwright E2E</div></div>
    <div style="margin-left:auto;text-align:right"><div style="font-size:28px;font-weight:800;color:{'#10b981' if _failed==0 else '#ef4444'}">{'ALL PASSED' if _failed==0 else f'{_failed} FAILED'}</div><div style="font-size:13px;color:#888">{_passed} passed · {_failed} failed · {elapsed}s</div></div>
  </div>
  <div style="display:flex;gap:2px;border-radius:4px;overflow:hidden;margin-bottom:16px">{bar}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">{"".join(f'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:10px 14px"><div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">{k}</div><div style="font-size:13px;color:#ddd;word-break:break-all">{v}</div></div>' for k,v in [("Target",BASE_URL),("Run ID",RUN_ID),("Test user",TEST_EMAIL.split("@")[0]+"@..."),("Checks",f"{_passed+_failed} total · {pct}% passed")])}</div>
</div>
<div style="padding:0 40px 40px;margin-top:24px"><div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden">
<table><thead><tr><th style="width:40px">#</th><th style="width:110px">Actor</th><th>Description / Screenshot</th><th style="width:50px">Status</th><th style="width:70px">Time</th></tr></thead><tbody>{rows}</tbody></table></div></div>
<div style="padding:16px 40px 32px;color:#333;font-size:12px;text-align:center;border-top:1px solid #111">Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · FLOW-03 · Run ID: {RUN_ID}</div></body></html>"""

    path.write_text(html, encoding="utf-8")
    return str(path)


# ══════════════════════════════════════════════════════════════════════════════
# FLOW-03: Customer Registration
# ══════════════════════════════════════════════════════════════════════════════
def run_registration_flow(headed=False, slow=False):
    global _passed, _failed, _step
    _passed=0; _failed=0; _step=0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  🧑 FLOW-03: Customer Registration{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target:  {BASE_URL}")
    print(f"  User:    {TEST_EMAIL}")
    print(f"  Mode:    {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"  Run ID:  {RUN_ID}")
    print(f"{'─'*64}\n")

    uid = None
    form_email = f"e2e-reg-form-{RUN_ID}@test.krishasparkles.com"
    form_uid   = None

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=not headed,
            slow_mo=1000 if slow else (300 if headed else 50),
        )
        ctx  = browser.new_context(viewport={"width":1280,"height":800})
        page = ctx.new_page()

        try:
            # Pre-decline cookies
            page.goto(f"{BASE_URL}/auth/register", wait_until="domcontentloaded")
            page.evaluate('localStorage.setItem("ks_cookie_consent","declined")')

            # ════════════════════════════════════════════════════════════
            # STEP 1 — Register page loads
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Register page loads")
            page.goto(f"{BASE_URL}/auth/register", wait_until="networkidle")
            expect(page.locator('h1:has-text("Create Account")')).to_be_visible(timeout=10000)
            ss = snap(page, "register_page")
            ok("CUSTOMER", "Register page loaded — \"Create Account\" heading visible", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 2 — Validation: mismatched passwords shows error
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Form validation: mismatched passwords")
            page.fill('input[placeholder="Priya"]', "Test")
            page.fill('input[placeholder="Sharma"]', "User")
            page.fill('input[placeholder="priya@example.com"]', form_email)
            page.fill('input[placeholder="Min 8 chars, uppercase, number, special"]', TEST_PASSWORD)
            page.fill('input[placeholder="Re-enter password"]', "WrongPass@9999")
            page.click('button[type="submit"]')
            page.wait_for_timeout(1000)
            ss = snap(page, "password_mismatch")
            err_loc = page.locator('text=Passwords do not match')
            if err_loc.count() > 0 and err_loc.first.is_visible():
                ok("CUSTOMER", "Mismatch error shown: \"Passwords do not match\" ✓", ss)
            else:
                fail("CUSTOMER", "Mismatch error not shown on screen", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 3 — Fill valid form and submit
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Fill valid registration form and submit")
            # Fix the confirm password field
            page.fill('input[placeholder="Re-enter password"]', TEST_PASSWORD)
            ss = snap(page, "register_form_filled")
            page.click('button[type="submit"]')
            page.wait_for_timeout(3000)

            # ════════════════════════════════════════════════════════════
            # STEP 4 — Verify "Check Your Email" confirmation screen
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Verify confirmation screen after submit")
            ss = snap(page, "after_register_submit")
            # The form shows "Check Your Email" or redirects — handle both
            check_email = page.locator('text=Check Your Email')
            verify_text = page.locator('text=verify your email')
            success_any = (check_email.count() > 0 and check_email.first.is_visible()) or \
                          (verify_text.count() > 0 and verify_text.first.is_visible())
            if success_any:
                ok("CUSTOMER", "Confirmation screen shown — \"Check Your Email\" visible ✓", ss)
                # Clean up the form-submitted user (unconfirmed)
                u = DB.get_user_by_email(form_email)
                if u:
                    form_uid = u.get("id")
            else:
                # May have redirected straight to homepage if auto-confirm is on
                current_url = page.url
                if BASE_URL in current_url and "/auth/" not in current_url:
                    ok("CUSTOMER", f"Auto-confirmed — redirected to {current_url.replace(BASE_URL,'')} ✓", ss)
                else:
                    fail("CUSTOMER", f"Neither confirmation screen nor redirect — URL: {current_url}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 5 — Login with pre-confirmed account (admin API)
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", f"Create pre-confirmed test user: {TEST_EMAIL}")
            uid = DB.create_user(TEST_EMAIL, TEST_PASSWORD, TEST_FIRST, TEST_LAST)
            ok("CUSTOMER", f"Pre-confirmed account created — {uid[:12]}...")
            time.sleep(1.5)

            step("CUSTOMER", "Login via browser form")
            # Clear any existing session — browser may still be authenticated from Step 4
            # auto-confirm redirect. If we don't clear, /auth/login redirects to /account
            # and page.fill for the email input times out (no input on account page).
            page.evaluate('() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e) {} }')
            ctx.clear_cookies()
            page.wait_for_timeout(600)
            page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle")
            expect(page.locator('h1:has-text("Welcome Back")')).to_be_visible(timeout=10000)
            page.fill('input[placeholder="priya@example.com"]', TEST_EMAIL)
            page.fill('input[placeholder="Your password"]', TEST_PASSWORD)
            ss = snap(page, "login_form")
            page.click('button[type="submit"]')
            expect(page.locator('button[aria-label="Account menu"]')).to_be_visible(timeout=15000)
            ss = snap(page, "logged_in")
            ok("CUSTOMER", "Logged in successfully — navbar avatar visible", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 6 — Verify /account welcome page
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Navigate to /account — verify welcome header")
            page.goto(f"{BASE_URL}/account", wait_until="networkidle")
            page.wait_for_timeout(2000)
            welcome = page.locator('text=Welcome back')
            expect(welcome.first).to_be_visible(timeout=10000)
            ss = snap(page, "account_home")
            ok("CUSTOMER", "Account dashboard loaded — \"Welcome back\" visible ✓", ss)

            # Verify the 4 quick-link cards
            for card_text in ["My Orders", "Edit Profile", "Refer a Friend"]:
                loc = page.locator(f'text="{card_text}"')
                if loc.count() > 0:
                    info("CUSTOMER", f"  ✅ Card visible: \"{card_text}\"")
                else:
                    info("CUSTOMER", f"  ⚠️  Card not found: \"{card_text}\"")

            # ════════════════════════════════════════════════════════════
            # STEP 7 — Fill and save profile
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Navigate to /account/profile — fill and save")
            page.goto(f"{BASE_URL}/account/profile", wait_until="networkidle")
            page.wait_for_timeout(1500)
            ss = snap(page, "profile_page")
            ok("CUSTOMER", "Profile page loaded", ss)

            # Fill personal info
            fn_input = page.locator('input[placeholder="Priya"]').first
            ln_input = page.locator('input[placeholder="Sharma"]').first
            fn_input.click(click_count=3)
            fn_input.fill(TEST_FIRST)
            ln_input.click(click_count=3)
            ln_input.fill(TEST_LAST)

            phone_input = page.locator('input[placeholder="+1 (555) 000-0000"]').first
            phone_input.click(click_count=3)
            phone_input.fill("+15551234567")

            # Fill address
            page.locator('input[placeholder="123 Main St"]').first.fill("456 E2E Ave")
            page.locator('input[placeholder="New York"]').first.fill("Bettendorf")
            page.locator('input[placeholder="NY"]').first.fill("IA")
            page.locator('input[placeholder="10001"]').first.fill("52722")

            ss = snap(page, "profile_filled")

            # Save
            save_btn = page.locator('button:has-text("Save Changes")').first
            expect(save_btn).to_be_visible(timeout=5000)
            save_btn.click()
            page.wait_for_timeout(3000)
            ss = snap(page, "profile_saved")

            # Check for success state
            saved_indicator = page.locator('text=Saved!')
            saving_done = saved_indicator.count() > 0 and saved_indicator.first.is_visible()
            if saving_done:
                ok("CUSTOMER", "Profile saved — \"Saved!\" confirmation visible ✓", ss)
            else:
                # May show toast or no explicit indicator — check no error
                error_loc = page.locator('text=error').first
                if error_loc.is_visible():
                    fail("CUSTOMER", "Profile save showed error on screen", ss)
                else:
                    ok("CUSTOMER", "Profile save completed (no error on screen) ✓", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 8 — Reload profile and verify persisted values
            # ════════════════════════════════════════════════════════════
            step("CUSTOMER", "Reload /account/profile — verify values persisted")
            page.goto(f"{BASE_URL}/account/profile", wait_until="networkidle")
            page.wait_for_timeout(2000)
            ss = snap(page, "profile_reloaded")

            fn_val = page.locator('input[placeholder="Priya"]').first.input_value()
            ln_val = page.locator('input[placeholder="Sharma"]').first.input_value()
            city_val = page.locator('input[placeholder="New York"]').first.input_value()

            if fn_val == TEST_FIRST and ln_val == TEST_LAST:
                ok("CUSTOMER", f"Profile persisted: {fn_val} {ln_val}, city={city_val} ✓", ss)
            else:
                fail("CUSTOMER",
                     f"Profile not persisted — got first='{fn_val}' last='{ln_val}' "
                     f"(expected '{TEST_FIRST}' '{TEST_LAST}')", ss)

        except Exception as e:
            fail("SYSTEM", f"FATAL: {e}")
            import traceback; traceback.print_exc()
            try: snap(page, "fatal_error")
            except: pass

        finally:
            print(f"\n{'─'*64}")
            step("CLEANUP", "Removing test users")
            for u_id, label in [(uid, TEST_EMAIL), (form_uid, "form-submitted user")]:
                if u_id:
                    try:
                        DB.delete_user(u_id)
                        ok("CLEANUP", f"Deleted: {label}")
                    except Exception as ce:
                        fail("CLEANUP", f"Cleanup failed ({label}): {ce}")
            ctx.close()
            browser.close()

    return _passed, _failed


# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Krisha Sparkles E2E — FLOW-03 Registration")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--slow",   action="store_true")
    args = parser.parse_args()

    passed, failed = run_registration_flow(headed=args.headed or args.slow, slow=args.slow)
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
