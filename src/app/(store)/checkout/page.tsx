"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowLeft, Lock, Tag, Check, X, Loader2, Gift } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { pushDataLayer } from "@/hooks/useDataLayer";

function CheckoutContent() {
  const { items, totalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    description: string | null;
  } | null>(null);
  const [discount, setDiscount] = useState(0);
  // Store credits
  const [storeCredit, setStoreCredit] = useState<number>(0);
  const [appliedCredit, setAppliedCredit] = useState<number>(0);
  // WhatsApp
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const subtotal = totalPrice();
  const finalTotal = Math.max(0, subtotal - discount - appliedCredit);

  // Pre-fill coupon from exit intent cookie
  useEffect(() => {
    function getCookieVal(name: string) {
      return document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))?.[1] ?? null;
    }
    const autoCoupon = getCookieVal("ks_coupon");
    if (autoCoupon) {
      setCouponCode(autoCoupon);
      // Clear the cookie so it doesn't re-fill
      document.cookie = `ks_coupon=; path=/; max-age=0`;
    }
  }, []);

  // Fetch available store credits on mount
  useEffect(() => {
    fetch("/api/credits/available")
      .then(r => r.json())
      .then(d => setStoreCredit(d.available || 0))
      .catch(() => {});
  }, []);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.error || "Invalid coupon");
        setAppliedCoupon(null);
        setDiscount(0);
      } else {
        setAppliedCoupon(data.coupon);
        setDiscount(data.discount);
        setCouponCode("");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponError("");
  }

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
          couponCode: appliedCoupon?.code || null,
          discountAmount: discount,
          appliedCredit,
          notifyWhatsApp,
          whatsAppPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        // Fire Meta Pixel InitiateCheckout
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "InitiateCheckout", {
            value: finalTotal,
            currency: "USD",
            num_items: items.length,
          });
        }

        // Fire TikTok Pixel InitiateCheckout
        if (typeof window !== "undefined" && window.ttq) {
          window.ttq.track("InitiateCheckout", {
            value: finalTotal,
            currency: "USD",
          });
        }

        // Push to GTM dataLayer
        pushDataLayer("initiate_checkout", {
          value: finalTotal,
          currency: "USD",
          num_items: items.length,
        });

        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

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
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>&#128142;</div>
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

        {/* Coupon Code */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <Tag size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Coupon Code</span>
          </div>

          {appliedCoupon ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px" }}>
              <Check size={16} style={{ color: "#10b981", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#10b981", margin: 0, fontFamily: "monospace" }}>{appliedCoupon.code}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                  {appliedCoupon.description || (
                    appliedCoupon.discount_type === "percentage"
                      ? `${appliedCoupon.discount_value}% off`
                      : `$${appliedCoupon.discount_value.toFixed(2)} off`
                  )} — saves {formatPrice(discount)}
                </p>
              </div>
              <button onClick={removeCoupon} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  placeholder="Enter coupon code"
                  className="input-dark"
                  style={{ flex: 1, minWidth: 0, fontFamily: "monospace", letterSpacing: "0.08em" }}
                  disabled={couponLoading}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  style={{
                    padding: "0 1.25rem",
                    minWidth: "88px",
                    flexShrink: 0,
                    background: "var(--gold-muted)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: "8px",
                    color: "var(--gold)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    whiteSpace: "nowrap",
                    opacity: !couponCode.trim() ? 0.5 : 1,
                  }}
                >
                  {couponLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Apply
                </button>
              </div>
              {couponError && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>{couponError}</p>
              )}
            </div>
          )}
        </div>

        {/* Store Credits */}
        {storeCredit > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <Gift size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Store Credits</span>
              <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#10b981", fontWeight: 700 }}>{formatPrice(storeCredit)} available</span>
            </div>
            {appliedCredit > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px" }}>
                <Check size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#10b981", margin: 0 }}>Credits Applied</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Saves {formatPrice(appliedCredit)}</p>
                </div>
                <button onClick={() => setAppliedCredit(0)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAppliedCredit(Math.min(storeCredit, subtotal - discount))}
                className="btn-gold-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Apply {formatPrice(Math.min(storeCredit, subtotal - discount))} credit
              </button>
            )}
          </div>
        )}

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
            <span style={{ fontSize: "0.875rem" }}>{formatPrice(subtotal)}</span>
          </div>
          {appliedCoupon && discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Tag size={13} /> Coupon ({appliedCoupon.code})
              </span>
              <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: 600 }}>
                &minus;{formatPrice(discount)}
              </span>
            </div>
          )}
          {appliedCredit > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "#10b981", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Gift size={13} /> Store Credit
              </span>
              <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: 600 }}>
                &minus;{formatPrice(appliedCredit)}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Shipping</span>
            <span style={{ fontSize: "0.875rem", color: "#10b981" }}>
              {finalTotal >= 75 ? "Free" : "Calculated at checkout"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--gold-border)", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <div style={{ textAlign: "right" }}>
              {(discount > 0 || appliedCredit > 0) && (
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", textDecoration: "line-through" }}>
                  {formatPrice(subtotal)}
                </span>
              )}
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)" }}>
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Order Updates */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={notifyWhatsApp}
              onChange={(e) => setNotifyWhatsApp(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--gold)", cursor: "pointer" }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>📱 Get order updates on WhatsApp</span>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>Receive order confirmation &amp; shipping updates</p>
            </div>
          </label>
          {notifyWhatsApp && (
            <div style={{ marginTop: "0.85rem" }}>
              <input
                type="tel"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder="Your WhatsApp number (e.g. +1 555 123 4567)"
                className="input-dark"
                style={{ width: "100%" }}
              />
            </div>
          )}
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
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Redirecting to Stripe...
            </>
          ) : (
            <>
              <Lock size={16} />
              {(appliedCoupon || appliedCredit > 0) ? `Pay ${formatPrice(finalTotal)} — Secure Checkout` : "Secure Checkout"}
            </>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <Lock size={12} style={{ color: "var(--subtle)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--subtle)" }}>
            SSL encrypted &bull; Powered by Stripe
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
