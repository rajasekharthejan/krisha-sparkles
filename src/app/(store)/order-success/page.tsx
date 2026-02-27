"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { trackEvent } from "@/lib/trackEvent";
import { CheckCircle, Package, ArrowRight, Instagram } from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCartStore();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!cleared) {
      clearCart();
      setCleared(true);

      // Consent-gated Purchase event — no-op on iOS WKWebView (Apple 5.1.2)
      trackEvent("Purchase", {
        currency: "USD",
        value: 0,
        transaction_id: sessionId || "",
      });
    }
  }, [clearCart, cleared, sessionId]);

  return (
    <div
      style={{
        paddingTop: "80px",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          animation: "zoomIn 0.5s ease",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(16,185,129,0.1)",
            border: "2px solid rgba(16,185,129,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 2rem",
            animation: "pulseGold 3s ease-in-out infinite",
          }}
        >
          <CheckCircle size={48} style={{ color: "#10b981" }} />
        </div>

        <div className="badge-gold" style={{ marginBottom: "1rem" }}>
          ✦ Order Confirmed
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 700,
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}
        >
          Thank You for Your Order!
        </h1>

        <div className="gold-divider" />

        <p
          style={{
            color: "var(--muted)",
            margin: "1.5rem 0",
            lineHeight: 1.8,
            fontSize: "0.9rem",
          }}
        >
          Your order has been placed successfully. You will receive a confirmation email shortly. We will ship your beautiful jewelry within 2-3 business days!
        </p>

        {sessionId && (
          <div
            style={{
              padding: "0.75rem 1.25rem",
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "8px",
              marginBottom: "2rem",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "2px" }}>Order Reference</p>
            <p style={{ fontSize: "0.8rem", color: "var(--gold)", fontFamily: "monospace" }}>
              {sessionId.slice(0, 30)}...
            </p>
          </div>
        )}

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {[
            { icon: "✅", label: "Order Placed" },
            { icon: "📦", label: "Being Prepared" },
            { icon: "🚚", label: "Ready to Ship" },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                padding: "1rem",
                background: i === 0 ? "rgba(16,185,129,0.1)" : "var(--surface)",
                border: `1px solid ${i === 0 ? "rgba(16,185,129,0.3)" : "var(--gold-border)"}`,
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{step.icon}</span>
              <span style={{ fontSize: "0.7rem", color: i === 0 ? "#10b981" : "var(--muted)", fontWeight: 500, textAlign: "center" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/shop" className="btn-gold">
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
          <a
            href="https://www.instagram.com/krisha.sparkles/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Instagram size={16} />
            Follow Us
          </a>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--subtle)", marginTop: "2rem" }}>
          Questions? Email us at{" "}
          <a href="mailto:hello@shopkrisha.com" style={{ color: "var(--gold)", textDecoration: "none" }}>
            hello@shopkrisha.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: "80px", minHeight: "100vh" }} />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
