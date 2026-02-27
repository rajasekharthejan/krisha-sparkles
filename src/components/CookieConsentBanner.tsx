"use client";

/**
 * CookieConsentBanner
 *
 * GDPR & Apple App Store Guideline 5.1.2 compliant consent banner.
 * Shown once per visitor on web browsers. Never shown inside iOS WKWebView
 * (where tracking is auto-declined). Never shown if user already made a choice.
 *
 * On "Accept All":  sets consent="granted" → pixels/cookies fire normally.
 * On "Decline":     sets consent="declined" → pixels/cookies are NOT loaded.
 *
 * This satisfies:
 *  - GDPR: explicit opt-in required before tracking
 *  - Apple 5.1.2: iOS WKWebView never tracks, web shows proper consent UI
 */

import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieConsentBanner() {
  const { showBanner, grant, decline } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "1rem",
        // subtle slide-up feel via margin
        animation: "slideUp 0.35s ease",
      }}
    >
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          background: "linear-gradient(135deg, #141007, #1a1500)",
          border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: "14px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)",
        }}
      >
        {/* Cookie icon */}
        <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🍪</span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "0 0 3px", color: "var(--text)" }}>
            We use cookies to improve your experience
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.775rem", margin: 0, lineHeight: 1.5 }}>
            We use analytics and advertising cookies (Meta Pixel, TikTok, Google Analytics) to show you relevant ads and measure site performance.
            {" "}<a href="/privacy-policy" style={{ color: "var(--gold)", textDecoration: "none" }}>Privacy Policy</a>
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={decline}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
          >
            Decline
          </button>
          <button
            onClick={grant}
            className="btn-gold"
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
