/**
 * useDataLayer / pushDataLayer
 *
 * Consent-aware GTM dataLayer push.
 * Re-exports trackDataLayer from @/lib/trackEvent for backward compatibility.
 * All calls are silently no-opped if the user has not granted cookie consent.
 *
 * Apple App Store Guideline 5.1.2: Safe — no-op on iOS WKWebView.
 */

import { trackDataLayer } from "@/lib/trackEvent";

/**
 * @deprecated Use trackEvent() from @/lib/trackEvent for unified pixel+dataLayer tracking.
 * Kept for backward compatibility with existing call sites.
 */
export function pushDataLayer(
  event: string,
  payload: Record<string, unknown> = {}
): void {
  trackDataLayer(event, payload);
}
