"use client";

/**
 * BackInStockButton
 *
 * Shown on product detail + product cards when stock_quantity === 0.
 * On click: reveals an email input form (pre-filled if logged in).
 * Calls POST /api/back-in-stock/subscribe to register the email.
 * Shows success / error state inline.
 */

import { useState } from "react";
import { Bell, Check, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface BackInStockButtonProps {
  productId: string;
  productName?: string;
  variant?: "button" | "link"; // "button" for product detail, "link" for product card
}

export default function BackInStockButton({
  productId,
  productName,
  variant = "button",
}: BackInStockButtonProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/back-in-stock/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409 = already subscribed — treat as success
        if (res.status === 409) {
          setSuccess(true);
        } else {
          setError(data.error || "Failed to subscribe. Please try again.");
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  // ── Link variant (compact — for ProductCard) ──────────────────────────────
  if (variant === "link") {
    if (success) {
      return (
        <p style={{ fontSize: "0.68rem", color: "#10b981", marginTop: "5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
          <Check size={11} /> You&apos;ll be notified!
        </p>
      );
    }
    if (open) {
      return (
        <div style={{ marginTop: "6px" }} onClick={(e) => e.preventDefault()}>
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              placeholder="your@email.com"
              style={{
                flex: 1, fontSize: "0.65rem", padding: "3px 6px",
                background: "var(--elevated)", border: "1px solid var(--gold-border)",
                borderRadius: "4px", color: "var(--text)", outline: "none", minWidth: 0,
              }}
              autoFocus
            />
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                padding: "3px 7px", background: "var(--gold-muted)", border: "1px solid var(--gold-border)",
                borderRadius: "4px", color: "var(--gold)", cursor: "pointer", fontSize: "0.65rem", fontWeight: 600, flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : "✓"}
            </button>
          </div>
          {error && <p style={{ fontSize: "0.6rem", color: "#ef4444", marginTop: "2px" }}>{error}</p>}
        </div>
      );
    }
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--gold)", fontSize: "0.68rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "3px", padding: "2px 0", marginTop: "4px",
        }}
      >
        <Bell size={10} /> Notify Me
      </button>
    );
  }

  // ── Button variant (full — for ProductDetailClient) ───────────────────────
  if (success) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.5rem",
        padding: "1rem 1.25rem",
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontWeight: 600 }}>
          <Check size={18} />
          You&apos;re on the waitlist!
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
          We&apos;ll email <strong style={{ color: "var(--text)" }}>{email}</strong> as soon as {productName || "this item"} is back in stock.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-gold-outline"
        style={{ flex: 1, justifyContent: "center", minWidth: "140px" }}
      >
        <Bell size={16} />
        Notify Me When Available
      </button>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "0.75rem",
      padding: "1.25rem",
      background: "var(--surface)", border: "1px solid var(--gold-border)",
      borderRadius: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bell size={15} style={{ color: "var(--gold)" }} />
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Get notified when available</span>
        </div>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          placeholder="your@email.com"
          className="input-dark"
          style={{ flex: 1, minWidth: 0 }}
          autoFocus
        />
        <button
          onClick={handleSubscribe}
          disabled={loading || !email.trim()}
          className="btn-gold"
          style={{
            padding: "0 1.25rem", flexShrink: 0, minWidth: "90px",
            opacity: !email.trim() ? 0.5 : 1,
          }}
        >
          {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
          Notify Me
        </button>
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: 0 }}>{error}</p>}
      <p style={{ color: "var(--subtle)", fontSize: "0.73rem", margin: 0 }}>
        We&apos;ll send one email when this item restocks. No spam.
      </p>
    </div>
  );
}
