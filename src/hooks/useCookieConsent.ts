"use client";

/**
 * useCookieConsent
 *
 * Manages cookie/tracking consent state with localStorage persistence.
 * Conforms to GDPR and Apple App Store Guideline 5.1.2 (ATT).
 *
 * Consent states:
 *   null     — user has not yet made a choice (show banner)
 *   "granted" — user accepted tracking (fire pixels)
 *   "declined" — user declined tracking (skip pixels)
 *
 * iOS WKWebView: auto-sets "declined" on first load — satisfies Apple review
 * requirement that apps "do not collect cookies for tracking on Apple devices".
 */

import { useState, useEffect } from "react";

export type ConsentState = "granted" | "declined" | null;

const CONSENT_KEY = "ks_cookie_consent";

/**
 * Detects iOS WKWebView (native app shell, not Safari browser).
 * WKWebView UA: has AppleWebKit + iPhone/iPad but lacks "Safari/" token
 * and common browser identifiers (CriOS, FxiOS).
 */
function isIOSWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const hasSafari = /Safari\//.test(ua);
  const hasBrowserToken = /(CriOS|FxiOS|OPiOS|EdgiOS|mercury)/.test(ua);
  // WKWebView = iOS device + no "Safari/" token + no other browser token
  return isIOS && !hasSafari && !hasBrowserToken;
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<ConsentState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If running inside iOS WKWebView, auto-decline tracking
    if (isIOSWebView()) {
      setConsentState("declined");
      setReady(true);
      return;
    }

    // Read stored consent from localStorage
    try {
      const stored = localStorage.getItem(CONSENT_KEY) as ConsentState;
      if (stored === "granted" || stored === "declined") {
        setConsentState(stored);
      }
    } catch { /* localStorage unavailable */ }
    setReady(true);
  }, []);

  function grant() {
    try { localStorage.setItem(CONSENT_KEY, "granted"); } catch { /* */ }
    setConsentState("granted");
  }

  function decline() {
    try { localStorage.setItem(CONSENT_KEY, "declined"); } catch { /* */ }
    setConsentState("declined");
  }

  // Show banner only when: ready + no decision yet + NOT iOS WebView
  const showBanner = ready && consent === null;

  return { consent, grant, decline, showBanner, ready };
}
