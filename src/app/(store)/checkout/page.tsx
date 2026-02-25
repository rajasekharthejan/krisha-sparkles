"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowLeft, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutContent() {
  const { items, totalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const total = totalPrice();

  async function handleCheckout() {
    if (items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-start checkout if cart has items and no cancellation
    if (items.length > 0 && !cancelled) {
      handleCheckout();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <ShoppingBag size={64} style={{ color: "var(--subtle)", margin: "0 auto 1.5rem", display: "block" }} strokeWidth={1} />
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Your cart is empty
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>Add some beautiful jewelry to your cart first!</p>
          <Link href="/shop" className="btn-gold">Browse Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link
          href="/shop"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem",
            marginBottom: "2rem", transition: "color 0.2s",
          }}
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
          Order Summary
        </h1>

        {cancelled && (
          <div
            style={{
              padding: "1rem", marginBottom: "1.5rem",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "8px", color: "#f59e0b", fontSize: "0.875rem",
            }}
          >
            Payment was cancelled. You can try again below.
          </div>
        )}

        {/* Items */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "1.5rem",
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "1rem",
                padding: "1.25rem",
                borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                alignItems: "center",
              }}
            >
              <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--elevated)" }}>
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={60} height={60} style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>💎</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "2px" }}>{item.name}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Qty: {item.quantity}</p>
              </div>
              <p style={{ color: "var(--gold)", fontWeight: 700, fontFamily: "var(--font-playfair)" }}>
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Subtotal</span>
            <span style={{ fontSize: "0.875rem" }}>{formatPrice(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Shipping</span>
            <span style={{ fontSize: "0.875rem", color: "#10b981" }}>
              {total >= 75 ? "Free" : "Calculated at checkout"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--gold-border)", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)" }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem", marginBottom: "1rem",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", color: "#ef4444", fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-gold"
          style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "1rem" }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Redirecting to Stripe...
            </>
          ) : (
            <>
              <Lock size={16} />
              Secure Checkout
            </>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <Lock size={12} style={{ color: "var(--subtle)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--subtle)" }}>
            SSL encrypted • Powered by Stripe
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: "80px", minHeight: "100vh" }} />}>
      <CheckoutContent />
    </Suspense>
  );
}
