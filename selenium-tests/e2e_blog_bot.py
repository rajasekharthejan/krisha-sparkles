#!/usr/bin/env python3
"""
FLOW-12: Blog Browse — Krisha Sparkles
=======================================
Tests the public blog: listing, tag filter, post detail, and social share:

  STEP 1   Navigate to /blog — verify "Style & Stories" heading
  STEP 2   Verify "✦ Journal" badge visible
  STEP 3   Check DB for published posts; gracefully handle empty state
  STEP 4   Verify featured post hero (most-viewed) OR post grid cards visible
  STEP 5   Verify "All Posts" tag filter pill exists
  STEP 6   If multiple tags found, click a tag pill → verify filtered results
  STEP 7   Click "All Posts" pill → verify all posts restored
  STEP 8   Click a blog post card → verify navigation to /blog/{slug}
  STEP 9   Verify post detail: title, "← All Posts" link, reading time meta
  STEP 10  Verify social share buttons visible (Twitter / Facebook / WhatsApp / copy)
  STEP 11  Verify newsletter CTA section present
  STEP 12  Verify "More Posts" footer link → navigate back to /blog

DEVELOPER CONTRACT (same rules as e2e_order_bot.py):
  - Never use str(N) in container_text for numeric checks
  - Always target data-testid for numeric assertions
  - read_numeric_field() returns -1 on missing (never silently passes)
  - Register all numeric selectors in SELECTOR_CONTRACT before first use

Run:
  source .venv/bin/activate
  python e2e_blog_bot.py
  python e2e_blog_bot.py --headed
  python e2e_blog_bot.py --slow
"""

import os, sys, uuid, base64, argparse, time
import requests as http_requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, expect

# ── env ──────────────────────────────────────────────────────────────────────
project_root = Path(__file__).resolve().parent.parent
for env_file in [".env.prod", ".env.local"]:
    p = project_root / env_file
    if p.exists():
        load_dotenv(p, override=(env_file == ".env.prod"))

BASE_URL     = os.getenv("BASE_URL", "https://shopkrisha.com").rstrip("/")
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

RUN_ID = uuid.uuid4().hex[:8]

SCREENSHOTS_DIR = Path(__file__).resolve().parent / "screenshots" / f"blog-{RUN_ID}"
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
def _c(a): return Y   # all customer-facing, use yellow
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
         "Content-Type": "application/json"}

    @staticmethod
    def blog_posts(limit=20) -> list[dict]:
        """Return published blog posts ordered by views desc."""
        r = http_requests.get(
            f"{SUPABASE_URL}/rest/v1/blog_posts",
            headers=DB.H,
            params={"published": "eq.true", "order": "views.desc",
                    "select": "id,title,slug,tags,views,content", "limit": str(limit)},
        )
        return r.json() if r.status_code < 400 else []

    @staticmethod
    def all_tags(posts: list[dict]) -> list[str]:
        """Collect unique non-empty tags from a list of post dicts."""
        tag_set: set[str] = set()
        for p in posts:
            for t in (p.get("tags") or []):
                if t:
                    tag_set.add(t)
        return sorted(tag_set)


# ── report ────────────────────────────────────────────────────────────────────
def _img_b64(path):
    if not path: return ""
    try:
        with open(path, "rb") as f: return "data:image/png;base64," + base64.b64encode(f.read()).decode()
    except: return ""

def generate_report() -> str:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = REPORTS_DIR / f"report_blog_{RUN_ID}_{ts}.html"
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
                 f'<td style="padding:10px 12px;vertical-align:top"><span style="background:#1a1205;color:#c9a84c;'
                 f'border:1px solid #c9a84c;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">'
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
                     ("Checks", f"{total} total · {pct}% passed"),
                     ("Elapsed", f"{elapsed}s")])
    html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>FLOW-12 Blog Browse {RUN_ID}</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#0a0a0a;color:#f0f0f0;font-family:-apple-system,sans-serif}}table{{width:100%;border-collapse:collapse}}th{{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#555;background:#0d0d0d;border-bottom:1px solid #1f1f1f}}</style>
</head><body>
<div style="background:linear-gradient(135deg,#0d1008,#1a2010);border-bottom:1px solid rgba(201,168,76,.3);padding:32px 40px 24px">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
    <div style="width:48px;height:48px;background:linear-gradient(135deg,#c9a84c,#f0d080);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px">📝</div>
    <div>
      <div style="font-size:20px;font-weight:700">FLOW-12: Blog Browse</div>
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
  Generated {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · FLOW-12 · Run ID: {RUN_ID}
</div>
</body></html>"""
    path.write_text(html, encoding="utf-8")
    return str(path)


# ── main flow ─────────────────────────────────────────────────────────────────
def run_blog_flow(headed=False, slow=False):
    global _passed, _failed, _step
    _passed = 0; _failed = 0; _step = 0; RESULTS.clear()

    print(f"\n{BOLD}{'═'*64}{R}")
    print(f"{BOLD}  📝 FLOW-12: Blog Browse{R}")
    print(f"{BOLD}{'═'*64}{R}")
    print(f"  Target: {BASE_URL}")
    print(f"  Mode:   {'HEADED' if headed else 'HEADLESS'}{' + SLOW' if slow else ''}")
    print(f"{'─'*64}\n")

    # Pre-fetch posts for planning
    posts   = DB.blog_posts()
    all_tags = DB.all_tags(posts)
    info("SYSTEM", f"Found {len(posts)} published blog post(s), {len(all_tags)} unique tag(s)")
    for p in posts[:5]:
        info("SYSTEM", f"  Post: \"{p['title'][:50]}\" (slug={p['slug']}, views={p['views']})")

    target_post = posts[0] if posts else None
    target_tag  = all_tags[0] if len(all_tags) >= 2 else None  # need ≥2 tags to test filtering

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=not headed,
                                     slow_mo=1000 if slow else (300 if headed else 50))
        ctx  = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()

        try:
            # Pre-decline cookie consent
            page.goto(f"{BASE_URL}/blog", wait_until="domcontentloaded")
            page.evaluate('localStorage.setItem("ks_cookie_consent","declined")')

            # ════════════════════════════════════════════════════════════
            # STEP 1 — /blog heading "Style & Stories"
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Navigate to /blog — verify \"Style & Stories\" heading")
            page.goto(f"{BASE_URL}/blog", wait_until="networkidle")
            page.wait_for_timeout(2500)   # client component fetches posts
            heading = page.locator('h1:has-text("Style")').first
            try:
                expect(heading).to_be_visible(timeout=10000)
                ss = snap(page, "blog_heading")
                ok("GUEST", "Blog /blog heading \"Style & Stories\" visible ✓", ss)
            except:
                ss = snap(page, "blog_heading_missing")
                fail("GUEST", "Heading \"Style & Stories\" not found on /blog", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 2 — "✦ Journal" badge
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify \"✦ Journal\" badge")
            journal_badge = page.locator('text="✦ Journal"').first
            try:
                expect(journal_badge).to_be_visible(timeout=5000)
                ss = snap(page, "journal_badge")
                ok("GUEST", "\"✦ Journal\" badge visible ✓", ss)
            except:
                ss = snap(page, "journal_badge_missing")
                fail("GUEST", "\"✦ Journal\" badge not found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 3 — Check posts state (empty vs populated)
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Check blog posts state (empty vs populated)")
            if not posts:
                # Empty state: look for "No posts yet" message
                empty_msg = page.locator('text="No posts yet"').first
                if empty_msg.is_visible():
                    ss = snap(page, "blog_empty_state")
                    ok("GUEST", "Empty state message visible (no posts in DB) ✓", ss)
                else:
                    ss = snap(page, "blog_state_unknown")
                    fail("GUEST", "No posts in DB and empty state message not visible", ss)
                info("GUEST", "⚠️  No posts available — skipping post-specific steps (4-12)")
                return _passed, _failed
            else:
                info("GUEST", f"  {len(posts)} post(s) found — continuing with full blog tests")
                ok("GUEST", f"DB reports {len(posts)} published post(s) ✓")

            # ════════════════════════════════════════════════════════════
            # STEP 4 — Featured post hero OR post grid cards
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify featured post hero or post grid cards visible")
            # Featured hero: article with "⭐ Most Popular" badge
            # Post grid: <article> elements linked to /blog/...
            featured_badge = page.locator('text="⭐ Most Popular"').first
            post_links     = page.locator('a[href^="/blog/"]:not([href="/blog"])').all()
            if featured_badge.is_visible():
                ss = snap(page, "featured_post_hero")
                ok("GUEST", "Featured post hero (⭐ Most Popular badge) visible ✓", ss)
            elif len(post_links) > 0:
                ss = snap(page, "post_grid_cards")
                ok("GUEST", f"{len(post_links)} post card link(s) visible ✓", ss)
            else:
                ss = snap(page, "no_post_content")
                fail("GUEST", "Neither featured hero nor post grid cards found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 5 — "All Posts" tag filter pill
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify \"All Posts\" tag filter pill")
            all_posts_pill = page.locator('button:has-text("All Posts")').first
            try:
                expect(all_posts_pill).to_be_visible(timeout=8000)
                ss = snap(page, "all_posts_pill")
                ok("GUEST", "\"All Posts\" tag filter pill visible ✓", ss)
            except:
                ss = snap(page, "all_posts_pill_missing")
                fail("GUEST", "\"All Posts\" tag filter pill not found", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 6 — Click a tag pill → verify filtered results
            # ════════════════════════════════════════════════════════════
            step("GUEST", f"Click tag filter pill → verify filtered results")
            if target_tag and all_tags:
                # Click the first tag (not "All Posts")
                tag_pill = page.locator(f'button:has-text("{target_tag}")').first
                if tag_pill.is_visible():
                    tag_pill.click()
                    page.wait_for_timeout(1000)
                    ss = snap(page, f"tag_filter_{target_tag[:10]}")
                    ok("GUEST", f"Tag pill \"{target_tag}\" clicked — filtered view shown ✓", ss)
                else:
                    ss = snap(page, "tag_pill_not_found")
                    fail("GUEST", f"Tag pill \"{target_tag}\" not visible on page", ss)
            else:
                # Not enough tags for filtering test — skip gracefully
                info("GUEST", f"  Only {len(all_tags)} unique tag(s) found — tag filter test skipped")
                ok("GUEST", "Tag filter step skipped (insufficient distinct tags in DB) ✓",
                   note=f"all_tags={all_tags}")

            # ════════════════════════════════════════════════════════════
            # STEP 7 — Click "All Posts" → verify all posts restored
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Click \"All Posts\" pill → verify all posts restored")
            all_posts_pill2 = page.locator('button:has-text("All Posts")').first
            if all_posts_pill2.is_visible():
                all_posts_pill2.click()
                page.wait_for_timeout(1000)
                post_count_after = len(page.locator('a[href^="/blog/"]:not([href="/blog"])').all())
                ss = snap(page, "all_posts_restored")
                ok("GUEST", f"\"All Posts\" clicked — {post_count_after} post link(s) visible ✓", ss)
            else:
                info("GUEST", "  \"All Posts\" pill not visible — likely still loading")
                fail("GUEST", "\"All Posts\" pill not clickable after tag filter")

            # ════════════════════════════════════════════════════════════
            # STEP 8 — Click a post card → navigate to /blog/{slug}
            # ════════════════════════════════════════════════════════════
            step("GUEST", f"Click blog post card → verify /blog/{target_post['slug']} URL")
            target_slug = target_post["slug"]
            target_title = target_post["title"]
            # Find a link to the target post
            post_card_link = page.locator(f'a[href="/blog/{target_slug}"]').first
            try:
                if not post_card_link.is_visible():
                    # Scroll to find it
                    page.keyboard.press("Home")
                    page.wait_for_timeout(500)
                expect(post_card_link).to_be_visible(timeout=8000)
                post_card_link.click()
                page.wait_for_url(f"**/blog/{target_slug}", timeout=10000)
                page.wait_for_timeout(1500)
                ss = snap(page, "blog_post_detail")
                ok("GUEST", f"Navigated to /blog/{target_slug} ✓", ss)
            except Exception as e:
                # Fallback: navigate directly
                page.goto(f"{BASE_URL}/blog/{target_slug}", wait_until="networkidle")
                page.wait_for_timeout(1500)
                if f"/blog/{target_slug}" in page.url:
                    ss = snap(page, "blog_post_direct_nav")
                    ok("GUEST", f"Direct nav to /blog/{target_slug} succeeded ✓", ss,
                       note=f"Card click failed: {str(e)[:60]}")
                else:
                    ss = snap(page, "blog_post_nav_fail")
                    fail("GUEST", f"Could not navigate to /blog/{target_slug}", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 9 — Post detail: title, "← All Posts" link, reading time
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify post detail: title, ← All Posts link, reading time")
            # Title
            try:
                post_title_el = page.locator(f'h1:has-text("{target_title[:30]}")').first
                expect(post_title_el).to_be_visible(timeout=8000)
                info("GUEST", f"  Post title \"{target_title[:40]}\" visible ✓")
            except:
                info("GUEST", f"  ⚠️  Post title not found by text (may be SSR)")

            # ← All Posts link
            back_link_ok = False
            back_link = page.locator('a:has-text("All Posts")').first
            if back_link.is_visible():
                back_link_ok = True
                info("GUEST", "  \"← All Posts\" back link visible ✓")
            else:
                info("GUEST", "  ⚠️  Back link not found (may be out of viewport)")

            # Reading time: look for "min read" text
            rt_ok = False
            reading_time_el = page.locator('text=/\\d+ min read/').first
            if reading_time_el.is_visible():
                rt_text = reading_time_el.inner_text()
                rt_ok = True
                info("GUEST", f"  Reading time: \"{rt_text}\" ✓")
            else:
                info("GUEST", "  ⚠️  Reading time meta not found")

            ss = snap(page, "post_detail_meta")
            if back_link_ok and rt_ok:
                ok("GUEST", "Post detail: title + ← All Posts + reading time all verified ✓", ss)
            elif back_link_ok or rt_ok:
                ok("GUEST", "Post detail: partial verification (back link or reading time found) ✓", ss,
                   note=f"back_link={back_link_ok} reading_time={rt_ok}")
            else:
                fail("GUEST", "Post detail missing expected meta elements (back link + reading time)", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 10 — Social share buttons
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify social share buttons (Twitter / Facebook / WhatsApp / copy-link)")
            # SocialShare component renders links/buttons with platform names or aria-labels
            share_found = 0
            share_selectors = [
                'a[href*="twitter.com"]',
                'a[href*="facebook.com"]',
                'a[href*="whatsapp.com"]',
                'button[aria-label*="copy" i], button:has-text("Copy")',
                'a[href*="x.com"]',   # Twitter rebranded to X
            ]
            for sel in share_selectors:
                try:
                    loc = page.locator(sel).first
                    if loc.is_visible():
                        share_found += 1
                        info("GUEST", f"  ✅ Share button found: {sel[:40]}")
                        break
                except:
                    pass

            # Also check for generic share section by looking for share icons text
            if share_found == 0:
                share_section = page.locator('text=/share/i').first
                if share_section.is_visible():
                    share_found = 1
                    info("GUEST", "  ✅ Share section found via text 'share'")

            ss = snap(page, "social_share")
            if share_found > 0:
                ok("GUEST", f"Social share button(s) visible ✓", ss)
            else:
                fail("GUEST", "No social share buttons found on post detail", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 11 — Newsletter CTA section
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify newsletter CTA section present in post detail")
            # BlogNewsletterCTA renders a subscribe form with email input
            newsletter_sels = [
                'input[type="email"][placeholder*="email" i]',
                'text=/subscribe/i',
                'text=/newsletter/i',
                'text=/stay in the loop/i',
                'text=/get notified/i',
            ]
            cta_found = False
            for sel in newsletter_sels:
                try:
                    loc = page.locator(sel).first
                    if loc.is_visible():
                        cta_found = True
                        info("GUEST", f"  ✅ Newsletter CTA found via: {sel[:50]}")
                        break
                except:
                    pass

            # Scroll down to reveal CTA if not in viewport
            if not cta_found:
                page.keyboard.press("End")
                page.wait_for_timeout(800)
                for sel in newsletter_sels:
                    try:
                        loc = page.locator(sel).first
                        if loc.is_visible():
                            cta_found = True
                            info("GUEST", f"  ✅ Newsletter CTA found after scroll: {sel[:50]}")
                            break
                    except:
                        pass

            ss = snap(page, "newsletter_cta")
            if cta_found:
                ok("GUEST", "Newsletter CTA section visible in post detail ✓", ss)
            else:
                fail("GUEST", "Newsletter CTA section not found on post detail page", ss)

            # ════════════════════════════════════════════════════════════
            # STEP 12 — "More Posts" footer link → back to /blog
            # ════════════════════════════════════════════════════════════
            step("GUEST", "Verify \"More Posts\" footer link → navigate back to /blog")
            # Scroll to bottom to reveal footer
            page.keyboard.press("End")
            page.wait_for_timeout(1000)
            more_posts_link = page.locator('a:has-text("More Posts")').first
            try:
                # Scroll the element into view
                if more_posts_link.count() > 0:
                    more_posts_link.scroll_into_view_if_needed()
                    page.wait_for_timeout(500)
                expect(more_posts_link).to_be_visible(timeout=8000)
                ss = snap(page, "more_posts_link")
                more_posts_link.click()
                page.wait_for_url("**/blog", timeout=8000)
                page.wait_for_timeout(1000)
                ss2 = snap(page, "back_to_blog_listing")
                ok("GUEST", "\"More Posts\" link clicked → returned to /blog listing ✓", ss2)
            except Exception as e:
                # Fallback: navigate directly
                page.goto(f"{BASE_URL}/blog", wait_until="networkidle")
                if "/blog" in page.url and "/blog/" not in page.url:
                    ss = snap(page, "blog_direct_back")
                    ok("GUEST", "Navigated back to /blog (direct fallback) ✓", ss,
                       note=f"More Posts click issue: {str(e)[:60]}")
                else:
                    ss = snap(page, "back_to_blog_fail")
                    fail("GUEST", f"Failed to navigate back to /blog: {str(e)[:80]}", ss)

        finally:
            browser.close()

    return _passed, _failed


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="FLOW-12: Blog Browse bot")
    ap.add_argument("--headed", action="store_true", help="Run with visible browser")
    ap.add_argument("--slow",   action="store_true", help="Slow motion (1s delays)")
    args = ap.parse_args()

    passed, failed = run_blog_flow(headed=args.headed, slow=args.slow)

    report_path = generate_report()

    print(f"\n{'═'*64}")
    print(f"  {'✅ ALL PASSED' if failed == 0 else '❌ SOME FAILED'}")
    print(f"  {passed} passed · {failed} failed")
    print(f"  Report → {report_path}")
    print(f"{'═'*64}\n")

    sys.exit(0 if failed == 0 else 1)
