"use client";

/**
 * PWAInstaller — shows "Add to Home Screen" banner on mobile
 * after 30 seconds if the beforeinstallprompt event fires.
 *
 * Stores dismissed state in localStorage so it only shows once.
 * Also registers the service worker on mount.
 */

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Don't show if already dismissed
    if (localStorage.getItem("pwa-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      // Show banner after 30 seconds
      setTimeout(() => setShowBanner(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!promptEvent) return;
    promptEvent.prompt();
    promptEvent.userChoice.then(() => {
      setShowBanner(false);
      setPromptEvent(null);
    });
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  if (!showBanner || !promptEvent) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        background: "var(--surface)",
        border: "1px solid var(--gold-border)",
        borderRadius: "14px",
        padding: "1rem 1.25rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "360px",
        width: "calc(100vw - 2rem)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <div style={{ background: "rgba(201,168,76,0.1)", borderRadius: "10px", padding: "0.6rem", flexShrink: 0 }}>
        <Smartphone size={20} style={{ color: "var(--gold)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.15rem" }}>Add to Home Screen</p>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Shop faster with our app-like experience</p>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: "0.45rem 0.9rem",
            background: "linear-gradient(135deg,#c9a84c,#e8c96a)",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "7px",
            fontWeight: 700,
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.3rem" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
