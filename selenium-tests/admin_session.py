"""
admin_session.py — Shared admin browser session cache for Krisha Sparkles E2E.

WHY THIS EXISTS:
  /api/admin/auth has a rate limiter: 5 attempts / 15 min per IP.
  When the full 12-flow suite runs, 4 admin bots (FLOW-02, 06, 07, 11) each
  try to log in via the UI form — hitting that limit and failing from FLOW-07+.

HOW IT WORKS:
  1. First admin bot that needs a session calls `admin_login(ctx, page, ...)`.
  2. `admin_login` checks /tmp/krisha_admin_session_prod.json (age < 45 min).
     - If fresh:  inject all saved cookies into the browser context → go to /admin
     - If stale/missing: do full UI gate+login, THEN save the storage state.
  3. All subsequent admin bots within the same 45-min window load from cache
     without touching /api/admin/auth.

RESULT:
  Only 1 actual admin login per 15-minute window regardless of how many
  admin bots run, keeping well within the 5/15-min rate limit.
"""

import json
import os
import time
from pathlib import Path

from playwright.sync_api import BrowserContext, Page, expect

# ── Config ──────────────────────────────────────────────────────────────────
SESSION_FILE    = Path("/tmp/krisha_admin_session_prod.json")
SESSION_MAX_AGE = 45 * 60   # 45 minutes — Supabase tokens are valid for 60 min


# ── Public API ───────────────────────────────────────────────────────────────

def admin_login(
    ctx: BrowserContext,
    page: Page,
    base_url: str,
    admin_gate: str,
    admin_email: str,
    admin_password: str,
) -> None:
    """
    Ensure the browser context is authenticated as admin and on /admin.

    Tries session cache first; falls back to full UI gate+login if the cache
    is missing or stale.  Always leaves the page at BASE_URL/admin with the
    "Dashboard" heading visible.

    Raises playwright.AssertionError if login fails.
    """
    if _try_load_session(ctx):
        # Cookies restored — navigate directly to /admin
        page.goto(f"{base_url}/admin", wait_until="networkidle")
        page.wait_for_timeout(1500)
        # If the page didn't redirect us away, we should see Dashboard
        if "dashboard" in page.url.lower() or "admin" in page.url.lower():
            try:
                expect(page.locator('text="Dashboard"').first).to_be_visible(timeout=10000)
                return  # ✅ session cache worked
            except Exception:
                pass  # fall through to fresh login below
        # Session was stale/expired on server side — clear and retry
        _clear_session()

    # Full UI login: gate → login form → dashboard
    _do_full_login(ctx, page, base_url, admin_gate, admin_email, admin_password)
    # Save state for subsequent bots
    _save_session(ctx)


# ── Private helpers ──────────────────────────────────────────────────────────

def _try_load_session(ctx: BrowserContext) -> bool:
    """Load cached cookies into context. Returns True if a valid cache exists."""
    if not SESSION_FILE.exists():
        return False
    age = time.time() - SESSION_FILE.stat().st_mtime
    if age > SESSION_MAX_AGE:
        SESSION_FILE.unlink(missing_ok=True)
        return False
    try:
        state = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
        cookies = state.get("cookies", [])
        if not cookies:
            return False
        # Playwright's add_cookies works for httpOnly cookies too
        ctx.add_cookies(cookies)
        return True
    except Exception:
        return False


def _save_session(ctx: BrowserContext) -> None:
    """Persist the browser storage state (all cookies) to the cache file."""
    try:
        state = ctx.storage_state()
        SESSION_FILE.write_text(json.dumps(state), encoding="utf-8")
    except Exception:
        pass  # non-fatal — next bot will just do a full login


def _clear_session() -> None:
    """Remove the cache file so the next call does a fresh login."""
    SESSION_FILE.unlink(missing_ok=True)


def _do_full_login(
    ctx: BrowserContext,
    page: Page,
    base_url: str,
    admin_gate: str,
    admin_email: str,
    admin_password: str,
) -> None:
    """Perform the full admin gate + login form flow."""
    # 1. Hit the gate endpoint to set the _adm_gt cookie
    page.goto(f"{base_url}/api/admin/gate?t={admin_gate}", wait_until="networkidle")
    page.wait_for_timeout(1500)

    # 2. Load the login form
    page.goto(f"{base_url}/admin/login", wait_until="networkidle")
    expect(page.locator('text="ADMIN PORTAL"')).to_be_visible(timeout=10000)

    # 3. Fill and submit credentials
    page.fill('input[placeholder="admin@krishasparkles.com"]', admin_email)
    page.fill('input[placeholder="••••••••"]', admin_password)
    page.click('button[type="submit"]')

    # 4. Wait for dashboard (login redirects here on success)
    expect(page.locator('text="Dashboard"').first).to_be_visible(timeout=20000)
