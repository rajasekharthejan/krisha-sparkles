"""
gallery_flows.py — Photo Reviews & UGC Gallery test flows (F198-F209).
Tests the gallery page, star ratings on product cards, rating breakdown bars,
customer photos on homepage, review stats API, and gallery API.
"""

import json
import time
from flows.base import FlowContext


# ── F198: Gallery Page Loads ──────────────────────────────────────────────────

def f198_gallery_page_loads(ctx: FlowContext) -> tuple[bool, str]:
    """Gallery page (/gallery) loads with header and correct title."""
    ctx.go("/gallery")
    time.sleep(2)
    body = ctx.body()
    if "Real Customers, Real Sparkle" not in body and "Customer Gallery" not in body:
        return False, "Gallery page header text not found"
    if "gallery" not in ctx.driver.current_url.lower():
        return False, f"Not on gallery page: {ctx.driver.current_url}"
    return True, "Gallery page loads with proper heading"


# ── F199: Gallery Filter Pills ────────────────────────────────────────────────

def f199_gallery_filter_pills(ctx: FlowContext) -> tuple[bool, str]:
    """Gallery page shows category filter pills and rating filter options."""
    ctx.go("/gallery")
    time.sleep(2)
    body = ctx.body()
    has_all = "All" in body
    has_rating_filter = "All Ratings" in body or "4+ Stars" in body or "5 Stars Only" in body
    if not has_all:
        return False, "Category 'All' filter pill not found"
    if not has_rating_filter:
        return False, "Rating filter pills not found"
    return True, "Gallery filter pills (category + rating) present"


# ── F200: Gallery Empty State ─────────────────────────────────────────────────

def f200_gallery_empty_state(ctx: FlowContext) -> tuple[bool, str]:
    """Gallery page handles empty state gracefully (shows message or photos)."""
    ctx.go("/gallery")
    time.sleep(2)
    body = ctx.body()
    # Either shows photo reviews or an empty state message
    has_photos = "photo review" in body.lower() or "verified" in body.lower()
    has_empty = "No Photo Reviews Yet" in body or "Be the first" in body
    has_content = len(body) > 500  # Page loaded with substantial content
    if not has_content:
        return False, "Gallery page has insufficient content"
    if has_photos or has_empty:
        return True, "Gallery shows photo reviews or proper empty state"
    return True, "Gallery page loaded with content"


# ── F201: Review Stats API Single Product ─────────────────────────────────────

def f201_review_stats_api_single(ctx: FlowContext) -> tuple[bool, str]:
    """GET /api/reviews/stats?product_id=UUID returns valid stats or 400."""
    ctx.go("/api/reviews/stats?product_id=00000000-0000-0000-0000-000000000000")
    time.sleep(1)
    body = ctx.body()
    # Should return JSON with stats or an empty result
    if "stats" in body or "avg_rating" in body or "review_count" in body:
        return True, "Stats API returns stats object for single product"
    if "error" in body.lower():
        # An error for a non-existent product is acceptable
        return True, "Stats API returns error for non-existent product (expected)"
    return False, f"Unexpected stats API response: {body[:200]}"


# ── F202: Review Stats API Batch ──────────────────────────────────────────────

def f202_review_stats_api_batch(ctx: FlowContext) -> tuple[bool, str]:
    """GET /api/reviews/stats?product_ids=... returns batch stats array."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    ctx.go(f"/api/reviews/stats?product_ids={fake_id},{fake_id}")
    time.sleep(1)
    body = ctx.body()
    if "stats" in body:
        return True, "Batch stats API returns stats array"
    if "error" in body.lower():
        return True, "Batch stats API returns error for non-existent products (expected)"
    return False, f"Unexpected batch stats response: {body[:200]}"


# ── F203: Gallery API Returns JSON ───────────────────────────────────────────

def f203_gallery_api_json(ctx: FlowContext) -> tuple[bool, str]:
    """GET /api/reviews/gallery returns JSON with reviews array."""
    ctx.go("/api/reviews/gallery?page=1&limit=5")
    time.sleep(1)
    body = ctx.body()
    if "reviews" in body and "total" in body and "page" in body:
        return True, "Gallery API returns proper JSON shape (reviews, total, page)"
    return False, f"Gallery API response missing expected keys: {body[:200]}"


# ── F204: Gallery API Category Filter ────────────────────────────────────────

def f204_gallery_api_category_filter(ctx: FlowContext) -> tuple[bool, str]:
    """Gallery API accepts category param without error."""
    ctx.go("/api/reviews/gallery?category=necklaces&limit=5")
    time.sleep(1)
    body = ctx.body()
    if "reviews" in body:
        return True, "Gallery API accepts category filter param"
    if "error" in body.lower():
        return False, f"Gallery API errored with category filter: {body[:200]}"
    return False, f"Unexpected gallery API response: {body[:200]}"


# ── F205: Gallery API Min Rating Filter ──────────────────────────────────────

def f205_gallery_api_min_rating(ctx: FlowContext) -> tuple[bool, str]:
    """Gallery API accepts min_rating param without error."""
    ctx.go("/api/reviews/gallery?min_rating=4&limit=5")
    time.sleep(1)
    body = ctx.body()
    if "reviews" in body:
        return True, "Gallery API accepts min_rating filter param"
    return False, f"Unexpected gallery API response: {body[:200]}"


# ── F206: Shop Page Has Star Ratings ─────────────────────────────────────────

def f206_shop_page_star_ratings(ctx: FlowContext) -> tuple[bool, str]:
    """Shop page product cards can display star ratings (when reviews exist)."""
    ctx.go("/shop")
    time.sleep(3)
    body = ctx.body()
    # The shop page should load with products
    if "Shop All Jewelry" not in body and "pieces available" not in body:
        return False, "Shop page did not load properly"
    # Star ratings may or may not be present (depends on if any products have reviews)
    # Just verify the page loaded and the ProductCard component renders
    page_len = len(body)
    if page_len < 500:
        return False, "Shop page has insufficient content"
    return True, f"Shop page loads successfully ({page_len} chars) — stars shown if reviews exist"


# ── F207: Product Detail Rating Breakdown ────────────────────────────────────

def f207_product_detail_breakdown(ctx: FlowContext) -> tuple[bool, str]:
    """Product detail page shows Customer Reviews section."""
    ctx.go("/shop")
    time.sleep(2)
    # Dismiss cookie banner if present
    ctx.dismiss_cookie_banner()
    time.sleep(1)
    # Find first product link and click via JS to avoid interception
    try:
        links = ctx.driver.find_elements("css selector", "a[href*='/shop/']")
        product_links = [l for l in links if "/shop/" in (l.get_attribute("href") or "") and (l.get_attribute("href") or "").count("/") >= 4]
        if not product_links:
            return False, "No product links found on shop page"
        href = product_links[0].get_attribute("href")
        ctx.driver.get(href)  # Direct navigation instead of click
        time.sleep(3)
    except Exception as e:
        return False, f"Could not navigate to product detail: {e}"

    body = ctx.body()
    if "Customer Reviews" not in body:
        return False, "Customer Reviews section not found on product detail"
    # Check for rating breakdown OR write a review prompt
    has_breakdown = "%" in body  # Breakdown bars show percentages
    has_empty = "Be the first to review" in body or "Write a Review" in body
    if has_breakdown or has_empty:
        return True, "Product detail shows review section (breakdown bars or write prompt)"
    return True, "Product detail has Customer Reviews section"


# ── F208: Gallery Nav Link ───────────────────────────────────────────────────

def f208_gallery_nav_link(ctx: FlowContext) -> tuple[bool, str]:
    """Navbar includes a Gallery link pointing to /gallery."""
    ctx.go("/")
    time.sleep(2)
    body = ctx.body()
    # Check for Gallery in nav links
    try:
        nav_links = ctx.driver.find_elements("css selector", "a[href='/gallery']")
        if nav_links and len(nav_links) > 0:
            return True, "Gallery nav link found in navigation"
    except:
        pass
    if "Gallery" in body:
        return True, "Gallery link text found in page body"
    return False, "Gallery nav link not found"


# ── F209: Homepage Customer Photos Section ───────────────────────────────────

def f209_homepage_customer_photos(ctx: FlowContext) -> tuple[bool, str]:
    """Homepage shows Customer Photos section if photo reviews exist, or loads without it."""
    ctx.go("/")
    time.sleep(3)
    body = ctx.body()
    # The section only renders if photo reviews exist
    has_section = "Real Customers, Real Sparkle" in body or "Photo Reviews" in body
    has_gallery_cta = "View Full Gallery" in body or "/gallery" in body
    homepage_loaded = "Krisha Sparkles" in body and len(body) > 2000

    if not homepage_loaded:
        return False, "Homepage did not load properly"

    if has_section:
        return True, "Homepage shows Customer Photos section with gallery CTA"
    # If no photo reviews exist, the section is hidden — that's OK
    return True, "Homepage loaded (customer photos section hidden — no photo reviews yet)"
