/**
 * trackEvent — Centralized, consent-aware analytics utility
 *
 * ALL pixel/analytics events in the entire app must go through this function.
 * Never call window.fbq(), window.ttq(), or window.dataLayer.push() directly.
 *
 * Why:
 * - Apple App Store Guideline 5.1.2: No tracking without consent on iOS
 * - GDPR: Must obtain explicit opt-in before firing tracking pixels
 * - iOS WKWebView: consent is auto-declined (useCookieConsent hook)
 *   so tracking NEVER fires inside the App Store version
 *
 * Usage:
 *   import { trackEvent } from "@/lib/trackEvent";
 *   trackEvent("AddToCart", { value: 29.99, currency: "USD" });
 *   trackEvent("Purchase", { value: 99, currency: "USD", order_id: "abc" });
 */

export type TrackEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "Purchase"
  | "Search"
  | "CompleteRegistration"
  | "Lead"
  | "Contact"
  | string; // allow custom events

const CONSENT_KEY = "ks_cookie_consent";

/**
 * Returns true if user has explicitly granted tracking consent.
 * Returns false if: declined, not yet decided, or running in iOS WKWebView.
 */
export function hasTrackingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Fire an analytics event across Meta Pixel, TikTok Pixel, and GTM dataLayer.
 * No-ops silently if consent is not granted.
 */
export function trackEvent(
  name: TrackEventName,
  params: Record<string, unknown> = {}
): void {
  if (!hasTrackingConsent()) return;

  // ── Meta Pixel ────────────────────────────────────────────────────────────
  if (typeof window !== "undefined" && window.fbq) {
    try { window.fbq("track", name, params); } catch { /* */ }
  }

  // ── TikTok Pixel ──────────────────────────────────────────────────────────
  if (typeof window !== "undefined" && window.ttq) {
    try { window.ttq.track(name, params); } catch { /* */ }
  }

  // ── GTM dataLayer ─────────────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name.toLowerCase().replace(/ /g, "_"), ...params });
  }
}

/**
 * Convenience: fire a custom GTM/dataLayer event only (no pixel).
 * Still consent-gated.
 */
export function trackDataLayer(
  event: string,
  payload: Record<string, unknown> = {}
): void {
  if (!hasTrackingConsent()) return;
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}
