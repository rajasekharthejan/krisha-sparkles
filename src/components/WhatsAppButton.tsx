"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";

const DEFAULT_MESSAGE = "Hi! I'm interested in your jewelry at Krisha Sparkles.";
const DISMISSED_KEY = "ks_wa_dismissed";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  // Hide on admin routes, when no number is configured, or when dismissed
  if (pathname?.startsWith("/admin") || !number || dismissed) return null;

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  const href = `https://wa.me/${number}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  function handleClick() {
    trackEvent("WhatsAppClick", { location: "floating_button" });
  }

  return (
    <div style={{ position: "fixed", bottom: "5.5rem", right: "1.5rem", zIndex: 60 }}>
      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "68px",
            right: 0,
            background: "#111",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "8px",
            padding: "0.5rem 0.85rem",
            fontSize: "0.75rem",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          💬 Replies within 1hr (9am–9pm IST)
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "22px",
              width: "8px",
              height: "8px",
              background: "#111",
              border: "1px solid rgba(201,168,76,0.25)",
              borderTop: "none",
              borderLeft: "none",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss WhatsApp button"
        style={{
          position: "absolute",
          top: "-6px",
          right: "-6px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#222",
          border: "1px solid #444",
          color: "#999",
          fontSize: "12px",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 2,
          padding: 0,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#333";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#222";
          e.currentTarget.style.color = "#999";
        }}
      >
        ✕
      </button>

      {/* Pulse ring */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(37,211,102,0.3)",
          animation: "pulseRing 2.5s ease-out infinite",
          pointerEvents: "none",
        }}
      />

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          position: "relative",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          color: "#fff",
          textDecoration: "none",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 28px rgba(37,211,102,0.55)";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(37,211,102,0.4)";
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
