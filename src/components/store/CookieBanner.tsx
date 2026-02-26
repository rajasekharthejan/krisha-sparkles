"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "ks_cookie_consent";

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "false");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "min(560px, calc(100vw - 2rem))",
        background: "var(--surface)",
        border: "1px solid var(--gold-border)",
        borderRadius: "14px",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        animation: "slideUp 0.35s ease",
      }}
    >
      <Cookie size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
      <p style={{ flex: 1, fontSize: "0.8rem", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
        We use cookies to personalise ads and analyse site traffic. By accepting, you consent to our use of analytics cookies.{" "}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "0.8rem",
            transition: "all 0.2s",
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="btn-gold"
          style={{ fontSize: "0.8rem", padding: "0.45rem 1.1rem" }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
