"""
flow_registry.py — Central registry of all 185 Krisha Sparkles test flows.
"""

from flows.base import FlowDef

# ── Import all flow modules ──────────────────────────────────────────────────

from flows.auth_flows import (
    f1_new_user_registers, f2_duplicate_email_error, f3_wrong_password_login,
    f4_correct_login, f5_forgot_password_form, f6_protected_page_redirect,
    f7_admin_without_gate_cookie, f8_admin_login_success,
    f9_wrong_email_admin_403, f10_session_persistence,
)
from flows.product_flows import (
    f11_browse_home_to_shop, f12_filter_by_category, f13_view_product_detail,
    f14_product_in_stock_add_to_cart, f15_out_of_stock_product,
    f16_featured_product_on_homepage, f17_inactive_product_not_shown,
    f18_admin_updates_price, f19_compare_price_sale_display, f20_invalid_slug_404,
)
from flows.cart_flows import (
    f21_add_to_cart_opens_drawer, f22_add_same_product_twice,
    f23_different_variants_separate_items, f24_remove_item_from_cart,
    f25_quantity_to_zero_removes, f26_cart_persists_across_sessions,
    f27_guest_cart_preserved_after_login, f28_cart_recommendations,
    f29_empty_cart_checkout_redirect, f30_cart_item_goes_oos,
)
from flows.checkout_flows import (
    f31_full_checkout_flow, f32_coupon_auto_fill_from_cookie,
    f33_valid_coupon_applies_discount, f34_expired_coupon_error,
    f35_max_uses_coupon_error, f36_store_credits_displayed,
    f37_loyalty_points_shown_if_enough, f38_discounts_stack,
    f39_whatsapp_notification_optin, f40_stripe_payment_fail_preserves_cart,
    f41_webhook_creates_order, f42_guest_checkout, f43_webhook_idempotency,
)
from flows.order_flows import (
    f44_order_success_page, f45_account_orders_list, f46_order_detail_page,
    f47_admin_updates_order_status, f48_shipping_notification_email,
    f49_review_request_email_after_delivery, f50_admin_generates_shipping_label,
)
from flows.review_flows import (
    f51_review_request_email_link, f52_submit_review_held_for_moderation,
    f53_admin_approves_review, f54_admin_rejects_review,
    f55_product_shows_average_rating, f56_no_reviews_prompt,
)
from flows.loyalty_flows import (
    f57_purchase_awards_points, f58_less_than_100_points_hidden,
    f59_exactly_100_points_toggle, f60_redeem_multiple_of_100,
    f61_redeem_points_discount_applied, f62_points_history_page,
    f63_points_plus_coupon_stacks,
)
from flows.coupon_flows import (
    f64_referral_link_sets_cookie, f65_newsletter_coupon_usage,
    f66_flash_sale_banner_auto_apply, f67_expired_flash_sale_no_banner,
    f68_min_order_amount_coupon, f69_max_discount_cap,
    f70_product_specific_coupon, f71_single_use_coupon,
    f72_admin_deactivates_coupon, f73_coupon_cannot_go_below_zero,
)
from flows.stock_flows import (
    f74_subscribe_oos_alert, f75_logged_in_email_prefilled,
    f76_duplicate_oos_subscription_rejected, f77_restock_triggers_notification,
    f78_multiple_subscribers_all_notified, f79_admin_sees_waitlist_count,
    f80_resubscribe_after_notification,
)
from flows.newsletter_flows import (
    f81_newsletter_subscribe, f82_resubscribe_reactivates,
    f83_day3_drip_email, f84_day7_drip_email, f85_one_click_unsubscribe,
    f86_admin_sends_campaign, f87_campaign_buyers_segment,
    f88_campaign_non_buyers_segment, f89_campaign_all_segment,
)
from flows.abandoned_flows import (
    f90_cart_persists_after_close, f91_abandoned_cart_email_trigger,
    f92_cart_recovery_link_valid, f93_abandoned_cart_admin_view,
    f94_cart_session_recovery,
)
from flows.referral_flows import (
    f95_referral_link_sets_cookie, f96_referral_discount_applies_at_checkout,
    f97_referral_page_exists, f98_referral_tracking_api,
    f99_admin_referral_report, f100_referral_cookie_expires,
)
from flows.wishlist_flows import (
    f101_add_to_wishlist, f102_wishlist_page_shows_items,
    f103_remove_from_wishlist, f104_wishlist_requires_login,
    f105_add_to_cart_from_wishlist, f106_back_in_stock_on_wishlist_item,
)
from flows.blog_flows import (
    f107_blog_listing_loads, f108_blog_post_opens, f109_blog_reading_time_shown,
    f110_blog_social_share, f111_blog_newsletter_cta, f112_blog_related_posts,
    f113_blog_tag_filter, f114_blog_featured_post, f115_admin_can_create_blog_post,
)
from flows.bundle_flows import (
    f116_bundles_page_loads, f117_bundle_detail_page, f118_add_bundle_to_cart,
    f119_bundle_savings_badge, f120_admin_bundle_management,
    f121_homepage_gift_sets_section,
)
from flows.recommendation_flows import (
    f122_product_recommendations_shown, f123_cart_recommendations_shown,
    f124_recommendations_api_responds, f125_order_success_recommendations,
)
from flows.collection_flows import (
    f126_category_filter_works, f127_category_page_loads,
    f128_sort_by_price, f129_search_functionality,
)
from flows.support_flows import (
    f130_contact_page_loads, f131_whatsapp_button_visible,
    f132_crisp_chat_loads, f133_faq_page_accessible,
    f134_shipping_policy_page, f135_return_policy_page,
)
from flows.push_flows import (
    f136_push_subscribe_api_exists, f137_pwa_manifest_accessible,
)
from flows.social_flows import (
    f138_instagram_feed_on_homepage, f139_tiktok_feed_on_homepage,
    f140_tiktok_shop_feed_api, f141_tiktok_pixel_fires,
    f142_admin_tiktok_posts_management,
)
from flows.account_flows import (
    f143_profile_update, f144_order_history_page, f145_change_password,
)
from flows.refund_flows import (
    f146_return_request_form, f147_admin_refund_management,
    f148_refund_api_protected,
)
from flows.admin_product_flows import (
    f149_admin_products_list, f150_admin_create_product,
    f151_admin_edit_product, f152_admin_delete_product,
    f153_admin_product_image_upload,
)
from flows.admin_order_flows import (
    f154_admin_orders_list, f155_admin_order_detail,
    f156_admin_update_order_status, f157_admin_orders_filter,
    f158_admin_order_search, f159_admin_export_orders,
)
from flows.admin_inventory_flows import (
    f160_admin_inventory_page, f161_admin_update_stock,
    f162_admin_low_stock_alerts, f163_admin_waitlist_count,
)
from flows.admin_analytics_flows import (
    f164_admin_analytics_page, f165_revenue_chart_loads,
    f166_top_products_analytics, f167_customer_analytics,
    f168_analytics_period_toggle, f169_newsletter_subscriber_analytics,
)
from flows.complex_flows import (
    f170_full_guest_purchase_flow, f171_coupon_plus_loyalty_stacking,
    f172_flash_sale_auto_apply, f173_wishlist_to_checkout,
    f174_referral_to_purchase_flow, f175_blog_to_product_flow,
    f176_back_in_stock_to_purchase, f177_admin_full_product_lifecycle,
    f178_newsletter_subscribe_to_campaign, f179_bundle_with_coupon_checkout,
    f180_loyalty_earn_then_redeem, f181_pwa_offline_fallback,
    f182_multi_item_cart_checkout, f183_admin_analytics_to_promotion,
    f184_complete_e2e_purchase, f185_admin_dashboard_overview,
)

# ── Build Registry ───────────────────────────────────────────────────────────

ALL_FLOWS: list[FlowDef] = [
    # F1-F10: Authentication
    FlowDef("F1",  "New User Registration",          "Register new account with unique email",                 "Authentication",   f1_new_user_registers),
    FlowDef("F2",  "Duplicate Email Error",           "Register with existing email shows error",               "Authentication",   f2_duplicate_email_error),
    FlowDef("F3",  "Wrong Password Login",            "Login with wrong password stays on login page",          "Authentication",   f3_wrong_password_login),
    FlowDef("F4",  "Correct Login",                   "Register then login redirects to account",               "Authentication",   f4_correct_login),
    FlowDef("F5",  "Forgot Password Form",            "Submit forgot-password form shows confirmation",         "Authentication",   f5_forgot_password_form),
    FlowDef("F6",  "Protected Page Redirect",         "Clear cookies, access /account → redirect to login",     "Authentication",   f6_protected_page_redirect),
    FlowDef("F7",  "Admin Without Gate Cookie",       "Admin without gate cookie returns 404",                  "Authentication",   f7_admin_without_gate_cookie),
    FlowDef("F8",  "Admin Login Success",             "Admin driver is already logged in successfully",         "Authentication",   f8_admin_login_success,        requires_admin=True),
    FlowDef("F9",  "Wrong Email Admin 403",           "Admin Layer 3 email check rejects non-admin emails",     "Authentication",   f9_wrong_email_admin_403),
    FlowDef("F10", "Session Persistence",             "Supabase cookies persist user session across pages",     "Authentication",   f10_session_persistence),

    # F11-F20: Product Browsing
    FlowDef("F11", "Browse Home to Shop",             "Navigate from homepage to shop listing",                 "Product Browsing", f11_browse_home_to_shop),
    FlowDef("F12", "Filter by Category",              "Category filter narrows product results",                "Product Browsing", f12_filter_by_category),
    FlowDef("F13", "View Product Detail",             "Clicking product opens detail page",                     "Product Browsing", f13_view_product_detail),
    FlowDef("F14", "In-Stock Add to Cart",            "In-stock product can be added to cart",                  "Product Browsing", f14_product_in_stock_add_to_cart),
    FlowDef("F15", "Out-of-Stock Product",            "OOS product shows Sold Out / notify button",             "Product Browsing", f15_out_of_stock_product),
    FlowDef("F16", "Featured Product on Homepage",    "Homepage shows featured products section",               "Product Browsing", f16_featured_product_on_homepage),
    FlowDef("F17", "Inactive Product Hidden",         "Inactive products not shown in shop listing",            "Product Browsing", f17_inactive_product_not_shown),
    FlowDef("F18", "Admin Updates Price",             "Admin updates product price and it reflects in store",   "Product Browsing", f18_admin_updates_price,       requires_admin=True),
    FlowDef("F19", "Compare Price Sale Display",      "Compare price shown as strikethrough on sale products",  "Product Browsing", f19_compare_price_sale_display),
    FlowDef("F20", "Invalid Slug 404",                "Invalid product slug shows 404 page",                    "Product Browsing", f20_invalid_slug_404),

    # F21-F30: Cart
    FlowDef("F21", "Add to Cart Opens Drawer",        "Add to Cart opens slide-out cart drawer",                "Cart",             f21_add_to_cart_opens_drawer),
    FlowDef("F22", "Add Same Product Twice",          "Adding same product twice increments quantity",          "Cart",             f22_add_same_product_twice),
    FlowDef("F23", "Different Variants Separate",     "Different variants are separate cart line items",        "Cart",             f23_different_variants_separate_items),
    FlowDef("F24", "Remove Item from Cart",           "Removing item clears it from cart",                      "Cart",             f24_remove_item_from_cart),
    FlowDef("F25", "Quantity Zero Removes Item",      "Setting quantity to zero removes item from cart",        "Cart",             f25_quantity_to_zero_removes),
    FlowDef("F26", "Cart Persists Across Sessions",   "Cart items persist in localStorage after navigation",    "Cart",             f26_cart_persists_across_sessions),
    FlowDef("F27", "Guest Cart After Login",          "Guest cart preserved after user logs in",                "Cart",             f27_guest_cart_preserved_after_login),
    FlowDef("F28", "Cart Recommendations",            "Complete Your Look recommendations in cart",             "Cart",             f28_cart_recommendations),
    FlowDef("F29", "Empty Cart Checkout Redirect",    "Empty cart redirects away from checkout",                "Cart",             f29_empty_cart_checkout_redirect),
    FlowDef("F30", "Cart Item Goes OOS",              "Item going OOS while in cart handled gracefully",        "Cart",             f30_cart_item_goes_oos),

    # F31-F43: Checkout
    FlowDef("F31", "Full Checkout Flow",              "Complete checkout from cart to Stripe redirect",         "Checkout",         f31_full_checkout_flow),
    FlowDef("F32", "Coupon Auto-Fill from Cookie",    "Referral coupon auto-fills from cookie at checkout",     "Checkout",         f32_coupon_auto_fill_from_cookie),
    FlowDef("F33", "Valid Coupon Applies Discount",   "Valid coupon code reduces order total",                  "Checkout",         f33_valid_coupon_applies_discount),
    FlowDef("F34", "Expired Coupon Error",            "Expired coupon shows error at checkout",                 "Checkout",         f34_expired_coupon_error),
    FlowDef("F35", "Max-Use Coupon Error",            "Used-up coupon shows max uses error",                    "Checkout",         f35_max_uses_coupon_error),
    FlowDef("F36", "Store Credits Displayed",         "Store credits balance shown at checkout",                "Checkout",         f36_store_credits_displayed),
    FlowDef("F37", "Loyalty Points Shown",            "Loyalty points toggle visible when >=100 pts",           "Checkout",         f37_loyalty_points_shown_if_enough),
    FlowDef("F38", "Discounts Stack",                 "Coupon + loyalty points both apply at checkout",         "Checkout",         f38_discounts_stack),
    FlowDef("F39", "WhatsApp Opt-In at Checkout",     "WhatsApp notification opt-in available at checkout",     "Checkout",         f39_whatsapp_notification_optin),
    FlowDef("F40", "Stripe Fail Preserves Cart",      "Failed Stripe payment keeps cart items intact",          "Checkout",         f40_stripe_payment_fail_preserves_cart),
    FlowDef("F41", "Webhook Creates Order",           "Stripe webhook creates order in DB",                     "Checkout",         f41_webhook_creates_order),
    FlowDef("F42", "Guest Checkout",                  "Guest user can checkout without account",                "Checkout",         f42_guest_checkout),
    FlowDef("F43", "Webhook Idempotency",             "Stripe webhook handles duplicate events safely",         "Checkout",         f43_webhook_idempotency),

    # F44-F50: Post-Purchase
    FlowDef("F44", "Order Success Page",              "Order success page loads after payment",                 "Post-Purchase",    f44_order_success_page),
    FlowDef("F45", "Account Orders List",             "Completed order appears in account orders page",         "Post-Purchase",    f45_account_orders_list),
    FlowDef("F46", "Order Detail Page",               "Order detail page shows items, total, status",           "Post-Purchase",    f46_order_detail_page),
    FlowDef("F47", "Admin Updates Order Status",      "Admin can change order status (pending to shipped)",     "Post-Purchase",    f47_admin_updates_order_status, requires_admin=True),
    FlowDef("F48", "Shipping Notification Email",     "Shipping notification email sent after status update",   "Post-Purchase",    f48_shipping_notification_email),
    FlowDef("F49", "Review Request Email",            "Review request email sent after delivery",               "Post-Purchase",    f49_review_request_email_after_delivery),
    FlowDef("F50", "Admin Shipping Label",            "Admin can generate/link shipping label",                 "Post-Purchase",    f50_admin_generates_shipping_label, requires_admin=True),

    # F51-F56: Reviews
    FlowDef("F51", "Review Request Email Link",       "Review request email links to product review form",      "Reviews",          f51_review_request_email_link),
    FlowDef("F52", "Submit Review for Moderation",    "User submits review held for admin moderation",          "Reviews",          f52_submit_review_held_for_moderation),
    FlowDef("F53", "Admin Approves Review",           "Admin approves pending review",                          "Reviews",          f53_admin_approves_review,     requires_admin=True),
    FlowDef("F54", "Admin Rejects Review",            "Admin rejects/deletes inappropriate review",             "Reviews",          f54_admin_rejects_review,      requires_admin=True),
    FlowDef("F55", "Product Shows Average Rating",    "Product shows average star rating from reviews",         "Reviews",          f55_product_shows_average_rating),
    FlowDef("F56", "No Reviews Prompt",               "Product with no reviews shows write-first-review prompt","Reviews",          f56_no_reviews_prompt),

    # F57-F63: Loyalty Points
    FlowDef("F57", "Purchase Awards Points",          "Loyalty points awarded in balance after purchase",       "Loyalty Points",   f57_purchase_awards_points),
    FlowDef("F58", "< 100 Points Toggle Hidden",      "Points toggle hidden when balance < 100",                "Loyalty Points",   f58_less_than_100_points_hidden),
    FlowDef("F59", "Exactly 100 Points Toggle",       "Points toggle appears when balance >= 100",              "Loyalty Points",   f59_exactly_100_points_toggle),
    FlowDef("F60", "Redeem Multiple of 100",          "Redeemed points must be in multiples of 100",            "Loyalty Points",   f60_redeem_multiple_of_100),
    FlowDef("F61", "Redeem Points Discount Applied",  "Points redemption reduces checkout total",               "Loyalty Points",   f61_redeem_points_discount_applied),
    FlowDef("F62", "Points History Page",             "Account points page shows earning/redeeming history",    "Loyalty Points",   f62_points_history_page),
    FlowDef("F63", "Points + Coupon Stacks",          "Loyalty points stack with coupon discount",              "Loyalty Points",   f63_points_plus_coupon_stacks),

    # F64-F73: Coupons
    FlowDef("F64", "Referral Link Sets Cookie",       "/?ref=CODE sets referral coupon cookie",                 "Coupons",          f64_referral_link_sets_cookie),
    FlowDef("F65", "Newsletter Coupon Usage",         "Newsletter coupon code works at checkout",               "Coupons",          f65_newsletter_coupon_usage),
    FlowDef("F66", "Flash Sale Banner Auto-Apply",    "Flash sale banner coupon auto-applies at checkout",      "Coupons",          f66_flash_sale_banner_auto_apply),
    FlowDef("F67", "Expired Flash Sale No Banner",    "Expired sale no longer shows banner",                    "Coupons",          f67_expired_flash_sale_no_banner),
    FlowDef("F68", "Min Order Amount Coupon",         "Coupon with min order rejected on small cart",           "Coupons",          f68_min_order_amount_coupon),
    FlowDef("F69", "Max Discount Cap",                "Percentage coupon capped at max discount amount",        "Coupons",          f69_max_discount_cap),
    FlowDef("F70", "Product-Specific Coupon",         "Coupon applied only to specified products/categories",   "Coupons",          f70_product_specific_coupon),
    FlowDef("F71", "Single-Use Coupon",               "Single-use coupon rejected after first use",             "Coupons",          f71_single_use_coupon),
    FlowDef("F72", "Admin Deactivates Coupon",        "Admin can deactivate a coupon from promotions page",     "Coupons",          f72_admin_deactivates_coupon,  requires_admin=True),
    FlowDef("F73", "Coupon Cannot Go Below Zero",     "Coupon discount cannot make total negative",             "Coupons",          f73_coupon_cannot_go_below_zero),

    # F74-F80: Back-in-Stock
    FlowDef("F74", "Subscribe OOS Alert",             "OOS product shows Notify Me - email submitted",          "Back-in-Stock",    f74_subscribe_oos_alert),
    FlowDef("F75", "Logged-In Email Prefilled",       "Notify Me form pre-fills email for logged-in users",     "Back-in-Stock",    f75_logged_in_email_prefilled),
    FlowDef("F76", "Duplicate OOS Subscription",      "Duplicate email for same product returns 409",           "Back-in-Stock",    f76_duplicate_oos_subscription_rejected),
    FlowDef("F77", "Restock Triggers Notification",   "Cron sends email when product restocked",                "Back-in-Stock",    f77_restock_triggers_notification),
    FlowDef("F78", "Multiple Subscribers Notified",   "All pending subscribers notified when restocked",        "Back-in-Stock",    f78_multiple_subscribers_all_notified),
    FlowDef("F79", "Admin Waitlist Count",            "Admin inventory shows waitlist count per product",        "Back-in-Stock",    f79_admin_sees_waitlist_count, requires_admin=True),
    FlowDef("F80", "Resubscribe After Notification",  "User can re-subscribe after being notified",             "Back-in-Stock",    f80_resubscribe_after_notification),

    # F81-F89: Newsletter
    FlowDef("F81", "Newsletter Subscribe",            "Homepage newsletter form subscribes email",              "Newsletter",       f81_newsletter_subscribe),
    FlowDef("F82", "Resubscribe Reactivates",         "Resubscribing reactivates inactive subscriber",         "Newsletter",       f82_resubscribe_reactivates),
    FlowDef("F83", "Day-3 Drip Email",                "Day-3 best sellers drip email triggered",               "Newsletter",       f83_day3_drip_email),
    FlowDef("F84", "Day-7 Drip Email",                "Day-7 refer-a-friend drip email triggered",             "Newsletter",       f84_day7_drip_email),
    FlowDef("F85", "One-Click Unsubscribe",           "Unsubscribe link marks subscriber inactive",            "Newsletter",       f85_one_click_unsubscribe),
    FlowDef("F86", "Admin Sends Campaign",            "Admin can send campaign to subscribers via Resend",      "Newsletter",       f86_admin_sends_campaign,      requires_admin=True),
    FlowDef("F87", "Campaign Buyers Segment",         "Campaign segment Buyers filters purchasers only",        "Newsletter",       f87_campaign_buyers_segment,   requires_admin=True),
    FlowDef("F88", "Campaign Non-Buyers Segment",     "Campaign segment Non-Buyers filters non-purchasers",     "Newsletter",       f88_campaign_non_buyers_segment, requires_admin=True),
    FlowDef("F89", "Campaign All Segment",            "Campaign segment All targets all active subscribers",    "Newsletter",       f89_campaign_all_segment,      requires_admin=True),

    # F90-F94: Abandoned Cart
    FlowDef("F90", "Cart Persists After Close",       "Cart items persist in localStorage after navigation",    "Abandoned Cart",   f90_cart_persists_after_close),
    FlowDef("F91", "Abandoned Cart Email Trigger",    "Abandoned cart cron endpoint exists and is protected",   "Abandoned Cart",   f91_abandoned_cart_email_trigger),
    FlowDef("F92", "Cart Recovery Link Valid",        "/cart?recover=TOKEN redirects to cart/login",            "Abandoned Cart",   f92_cart_recovery_link_valid),
    FlowDef("F93", "Abandoned Cart Admin View",       "Admin analytics shows abandoned cart metrics",           "Abandoned Cart",   f93_abandoned_cart_admin_view, requires_admin=True),
    FlowDef("F94", "Cart Session Recovery",           "Cart data recoverable from localStorage",                "Abandoned Cart",   f94_cart_session_recovery),

    # F95-F100: Referrals
    FlowDef("F95",  "Referral Link Sets Cookie",      "/?ref=CODE stores referral in cookie/localStorage",      "Referrals",        f95_referral_link_sets_cookie),
    FlowDef("F96",  "Referral Discount at Checkout",  "Referral coupon auto-fills at checkout",                 "Referrals",        f96_referral_discount_applies_at_checkout),
    FlowDef("F97",  "Referral Page Exists",           "Referral program page is accessible",                    "Referrals",        f97_referral_page_exists),
    FlowDef("F98",  "Referral Tracking API",          "Referral tracking API endpoint exists",                  "Referrals",        f98_referral_tracking_api),
    FlowDef("F99",  "Admin Referral Report",          "Admin can see referral analytics",                       "Referrals",        f99_admin_referral_report,     requires_admin=True),
    FlowDef("F100", "Referral Cookie Expires",        "Referral cookie has proper expiry set",                  "Referrals",        f100_referral_cookie_expires),

    # F101-F106: Wishlist
    FlowDef("F101", "Add to Wishlist",                "Logged-in user can add product to wishlist",             "Wishlist",         f101_add_to_wishlist),
    FlowDef("F102", "Wishlist Page Shows Items",      "Wishlist page shows saved products",                     "Wishlist",         f102_wishlist_page_shows_items),
    FlowDef("F103", "Remove From Wishlist",           "User can remove item from wishlist",                     "Wishlist",         f103_remove_from_wishlist),
    FlowDef("F104", "Wishlist Requires Login",        "Wishlist page redirects unauthenticated users",          "Wishlist",         f104_wishlist_requires_login),
    FlowDef("F105", "Add to Cart from Wishlist",      "User can add wishlist item directly to cart",            "Wishlist",         f105_add_to_cart_from_wishlist),
    FlowDef("F106", "Back-in-Stock on Wishlist",      "Back-in-stock notification on OOS wishlist items",       "Wishlist",         f106_back_in_stock_on_wishlist_item),

    # F107-F115: Blog
    FlowDef("F107", "Blog Listing Loads",             "Blog listing page loads with posts",                     "Blog",             f107_blog_listing_loads),
    FlowDef("F108", "Blog Post Opens",                "Clicking blog post opens full article",                  "Blog",             f108_blog_post_opens),
    FlowDef("F109", "Blog Reading Time Shown",        "Blog posts show estimated reading time",                 "Blog",             f109_blog_reading_time_shown),
    FlowDef("F110", "Blog Social Share",              "Blog post has Twitter/Facebook/WhatsApp share buttons",  "Blog",             f110_blog_social_share),
    FlowDef("F111", "Blog Newsletter CTA",            "Blog post has inline newsletter subscription CTA",       "Blog",             f111_blog_newsletter_cta),
    FlowDef("F112", "Blog Related Posts",             "Blog article shows related posts at bottom",             "Blog",             f112_blog_related_posts),
    FlowDef("F113", "Blog Tag Filter",                "Blog listing has tag filter pills",                      "Blog",             f113_blog_tag_filter),
    FlowDef("F114", "Blog Featured Post",             "Blog listing shows featured/hero post",                  "Blog",             f114_blog_featured_post),
    FlowDef("F115", "Admin Creates Blog Post",        "Admin can access blog creation form",                    "Blog",             f115_admin_can_create_blog_post, requires_admin=True),

    # F116-F121: Bundles
    FlowDef("F116", "Bundles Page Loads",             "/bundles page loads with active gift sets",              "Bundles",          f116_bundles_page_loads),
    FlowDef("F117", "Bundle Detail Page",             "Bundle detail shows included products and savings",      "Bundles",          f117_bundle_detail_page),
    FlowDef("F118", "Add Bundle to Cart",             "Add Bundle to Cart adds all included products",          "Bundles",          f118_add_bundle_to_cart),
    FlowDef("F119", "Bundle Savings Badge",           "Bundle shows savings badge vs individual prices",        "Bundles",          f119_bundle_savings_badge),
    FlowDef("F120", "Admin Bundle Management",        "Admin can manage bundles (create/edit/toggle)",          "Bundles",          f120_admin_bundle_management,  requires_admin=True),
    FlowDef("F121", "Homepage Gift Sets Section",     "Homepage Gift Sets section links to /bundles",           "Bundles",          f121_homepage_gift_sets_section),

    # F122-F125: Recommendations
    FlowDef("F122", "Product Recommendations",        "You May Also Love section on product detail",            "Recommendations",  f122_product_recommendations_shown),
    FlowDef("F123", "Cart Recommendations",           "Complete Your Look recommendations in cart",             "Recommendations",  f123_cart_recommendations_shown),
    FlowDef("F124", "Recommendations API",            "/api/recommendations endpoint exists and validates",     "Recommendations",  f124_recommendations_api_responds),
    FlowDef("F125", "Order Success Recommendations",  "Shop More recommendations on order success page",        "Recommendations",  f125_order_success_recommendations),

    # F126-F129: Collections
    FlowDef("F126", "Category Filter Works",          "Category filter on shop narrows results",                "Collections",      f126_category_filter_works),
    FlowDef("F127", "Category Page Loads",            "Each category page loads correctly",                     "Collections",      f127_category_page_loads),
    FlowDef("F128", "Sort by Price",                  "Shop products can be sorted by price",                   "Collections",      f128_sort_by_price),
    FlowDef("F129", "Search Functionality",           "Search finds products matching query",                   "Collections",      f129_search_functionality),

    # F130-F135: Support
    FlowDef("F130", "Contact Page Loads",             "Contact page is accessible with contact info",           "Support",          f130_contact_page_loads),
    FlowDef("F131", "WhatsApp Button Visible",        "WhatsApp floating button visible on store pages",        "Support",          f131_whatsapp_button_visible),
    FlowDef("F132", "Crisp Chat Loads",               "Crisp live chat widget loads on store pages",            "Support",          f132_crisp_chat_loads),
    FlowDef("F133", "FAQ Page Accessible",            "FAQ / Help page is accessible",                          "Support",          f133_faq_page_accessible),
    FlowDef("F134", "Shipping Policy Page",           "Shipping policy page is accessible",                     "Support",          f134_shipping_policy_page),
    FlowDef("F135", "Return Policy Page",             "Return/Refund policy page is accessible",                "Support",          f135_return_policy_page),

    # F136-F137: PWA & Push
    FlowDef("F136", "Push Subscribe API",             "Push notification subscribe API endpoint exists",        "PWA & Push",       f136_push_subscribe_api_exists),
    FlowDef("F137", "PWA Manifest Accessible",        "manifest.json and service worker accessible",            "PWA & Push",       f137_pwa_manifest_accessible),

    # F138-F142: Social
    FlowDef("F138", "Instagram Feed on Homepage",     "Instagram feed section appears on homepage",             "Social & Feeds",   f138_instagram_feed_on_homepage),
    FlowDef("F139", "TikTok Feed on Homepage",        "TikTok section appears on homepage",                     "Social & Feeds",   f139_tiktok_feed_on_homepage),
    FlowDef("F140", "TikTok Shop Feed API",           "TikTok Shop TSV feed API returns product data",          "Social & Feeds",   f140_tiktok_shop_feed_api),
    FlowDef("F141", "TikTok Pixel Fires",             "TikTok Pixel script loads on store pages",               "Social & Feeds",   f141_tiktok_pixel_fires),
    FlowDef("F142", "Admin TikTok Management",        "Admin can manage TikTok post thumbnails",                "Social & Feeds",   f142_admin_tiktok_posts_management, requires_admin=True),

    # F143-F145: Account
    FlowDef("F143", "Profile Update",                 "Logged-in user can update profile information",          "Account",          f143_profile_update),
    FlowDef("F144", "Order History Page",             "Order history page shows past orders",                   "Account",          f144_order_history_page),
    FlowDef("F145", "Change Password",                "Password change flow is accessible",                     "Account",          f145_change_password),

    # F146-F148: Refunds
    FlowDef("F146", "Return Request Form",            "Return request form is accessible",                      "Refunds",          f146_return_request_form),
    FlowDef("F147", "Admin Refund Management",        "Admin can manage refund requests",                       "Refunds",          f147_admin_refund_management,  requires_admin=True),
    FlowDef("F148", "Refund API Protected",           "Refund API requires admin authentication",               "Refunds",          f148_refund_api_protected),

    # F149-F153: Admin Products
    FlowDef("F149", "Admin Products List",            "Admin products page lists all products",                 "Admin: Products",  f149_admin_products_list,      requires_admin=True),
    FlowDef("F150", "Admin Create Product",           "Admin can access product creation form",                 "Admin: Products",  f150_admin_create_product,     requires_admin=True),
    FlowDef("F151", "Admin Edit Product",             "Admin can edit an existing product",                     "Admin: Products",  f151_admin_edit_product,       requires_admin=True),
    FlowDef("F152", "Admin Delete Product",           "Admin product delete button exists",                     "Admin: Products",  f152_admin_delete_product,     requires_admin=True),
    FlowDef("F153", "Admin Image Upload",             "Product form has image upload functionality",            "Admin: Products",  f153_admin_product_image_upload, requires_admin=True),

    # F154-F159: Admin Orders
    FlowDef("F154", "Admin Orders List",              "Admin orders page loads with order list",                "Admin: Orders",    f154_admin_orders_list,        requires_admin=True),
    FlowDef("F155", "Admin Order Detail",             "Admin can view order detail page",                       "Admin: Orders",    f155_admin_order_detail,       requires_admin=True),
    FlowDef("F156", "Admin Update Order Status",      "Admin can update order status",                          "Admin: Orders",    f156_admin_update_order_status, requires_admin=True),
    FlowDef("F157", "Admin Orders Filter",            "Admin orders can be filtered by status",                 "Admin: Orders",    f157_admin_orders_filter,      requires_admin=True),
    FlowDef("F158", "Admin Order Search",             "Admin can search orders by email/ID",                    "Admin: Orders",    f158_admin_order_search,       requires_admin=True),
    FlowDef("F159", "Admin Export Orders",            "Admin can export orders as CSV",                         "Admin: Orders",    f159_admin_export_orders,      requires_admin=True),

    # F160-F163: Admin Inventory
    FlowDef("F160", "Admin Inventory Page",           "Admin inventory page loads with stock levels",           "Admin: Inventory", f160_admin_inventory_page,     requires_admin=True),
    FlowDef("F161", "Admin Update Stock",             "Admin can update product stock quantity",                "Admin: Inventory", f161_admin_update_stock,       requires_admin=True),
    FlowDef("F162", "Admin Low Stock Alerts",         "Admin can see low stock alerts",                         "Admin: Inventory", f162_admin_low_stock_alerts,   requires_admin=True),
    FlowDef("F163", "Admin Waitlist Count",           "Admin inventory shows back-in-stock waitlist counts",    "Admin: Inventory", f163_admin_waitlist_count,     requires_admin=True),

    # F164-F169: Admin Analytics
    FlowDef("F164", "Admin Analytics Page",           "Admin analytics page loads with charts",                 "Admin: Analytics", f164_admin_analytics_page,     requires_admin=True),
    FlowDef("F165", "Revenue Chart Loads",            "Revenue chart section loads with data",                  "Admin: Analytics", f165_revenue_chart_loads,      requires_admin=True),
    FlowDef("F166", "Top Products Analytics",         "Admin analytics shows top products table",               "Admin: Analytics", f166_top_products_analytics,   requires_admin=True),
    FlowDef("F167", "Customer Analytics",             "Admin analytics shows customer statistics",              "Admin: Analytics", f167_customer_analytics,       requires_admin=True),
    FlowDef("F168", "Analytics Period Toggle",        "Analytics 30/60/90 day toggle works",                    "Admin: Analytics", f168_analytics_period_toggle,  requires_admin=True),
    FlowDef("F169", "Newsletter Subscriber Stats",    "Admin can see newsletter subscriber stats",              "Admin: Analytics", f169_newsletter_subscriber_analytics, requires_admin=True),

    # F170-F185: Complex Flows
    FlowDef("F170", "Full Guest Purchase Flow",       "Guest user completes full purchase without login",        "Complex Flows",    f170_full_guest_purchase_flow),
    FlowDef("F171", "Coupon + Loyalty Stacking",      "Coupon discount + loyalty points both apply",            "Complex Flows",    f171_coupon_plus_loyalty_stacking),
    FlowDef("F172", "Flash Sale Auto-Apply",          "Active flash sale auto-applies at checkout",             "Complex Flows",    f172_flash_sale_auto_apply),
    FlowDef("F173", "Wishlist to Checkout",           "User moves wishlist item through full purchase",          "Complex Flows",    f173_wishlist_to_checkout),
    FlowDef("F174", "Referral to Purchase Flow",      "Referral link to discount applied to checkout",          "Complex Flows",    f174_referral_to_purchase_flow),
    FlowDef("F175", "Blog to Product Flow",           "Blog post links to relevant products in shop",           "Complex Flows",    f175_blog_to_product_flow),
    FlowDef("F176", "Back-in-Stock to Purchase",      "Back-in-stock notification to product purchase path",    "Complex Flows",    f176_back_in_stock_to_purchase),
    FlowDef("F177", "Admin Product Lifecycle",        "Admin creates product visible in store",                  "Complex Flows",    f177_admin_full_product_lifecycle, requires_admin=True),
    FlowDef("F178", "Newsletter to Welcome Email",    "Newsletter subscribe triggers welcome email drip",        "Complex Flows",    f178_newsletter_subscribe_to_campaign),
    FlowDef("F179", "Bundle + Coupon Checkout",       "Bundle purchase with coupon discount at checkout",        "Complex Flows",    f179_bundle_with_coupon_checkout),
    FlowDef("F180", "Loyalty Earn Then Redeem",       "Full loyalty: check balance then apply at checkout",     "Complex Flows",    f180_loyalty_earn_then_redeem),
    FlowDef("F181", "PWA Offline Fallback",           "PWA service worker provides offline fallback",           "Complex Flows",    f181_pwa_offline_fallback),
    FlowDef("F182", "Multi-Item Cart Checkout",       "Cart with multiple items checks out correctly",          "Complex Flows",    f182_multi_item_cart_checkout),
    FlowDef("F183", "Analytics to Promotion",         "Admin views analytics then creates targeted promotion",  "Complex Flows",    f183_admin_analytics_to_promotion, requires_admin=True),
    FlowDef("F184", "Complete E2E Purchase",          "Browse to product to cart to checkout (full E2E)",       "Complex Flows",    f184_complete_e2e_purchase),
    FlowDef("F185", "Admin Dashboard Overview",       "Admin dashboard shows complete store overview",           "Complex Flows",    f185_admin_dashboard_overview, requires_admin=True),
]

# ── Derived lookups ──────────────────────────────────────────────────────────

FLOWS_BY_ID: dict[str, FlowDef] = {f.id: f for f in ALL_FLOWS}

FLOWS_BY_CATEGORY: dict[str, list[FlowDef]] = {}
for flow in ALL_FLOWS:
    FLOWS_BY_CATEGORY.setdefault(flow.category, []).append(flow)

CATEGORIES: list[str] = list(FLOWS_BY_CATEGORY.keys())


def get_flow(flow_id: str) -> "FlowDef | None":
    return FLOWS_BY_ID.get(flow_id)

def get_category_flows(category: str) -> list[FlowDef]:
    return FLOWS_BY_CATEGORY.get(category, [])

def search_flows(query: str) -> list[FlowDef]:
    q = query.lower()
    return [f for f in ALL_FLOWS if q in f.name.lower() or q in f.description.lower()]
