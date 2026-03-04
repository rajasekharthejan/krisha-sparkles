"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowLeft, Lock, Tag, Check, X, Loader2, Gift, Star, MapPin, Truck, BookmarkCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { trackEvent } from "@/lib/trackEvent";
import AddressAutocomplete from "@/components/store/AddressAutocomplete";

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
  // Loyalty points
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsError, setPointsError] = useState("");
  const [pointsLoading, setPointsLoading] = useState(false);
  // Shipping settings (fetched from DB — admin-configurable)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(75);
  const [standardRate, setStandardRate] = useState(9.99);
  const [expressRate, setExpressRate] = useState(14.99);
  // Shipping destination + address
  const [shippingState, setShippingState] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<"free" | "standard" | "express">("standard");
  // Phone (part of address) + WhatsApp opt-in
  const [phone, setPhone] = useState("");
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  // Saved address
  const [savedAddress, setSavedAddress] = useState<null | {
    firstName: string; lastName: string; addressLine1: string;
    addressLine2: string; city: string; state: string; zipCode: string;
  }>(null);
  const [savedAddressUsed, setSavedAddressUsed] = useState(false);
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  const subtotal = totalPrice();
  const freeShipping = subtotal >= freeShippingThreshold;

  // Auto-set shipping method based on subtotal
  const shippingCost = freeShipping ? 0 : selectedShipping === "express" ? expressRate : standardRate;

  const TX_TAX_RATE = 0.0825; // 8.25% (6.25% TX state + 2% Melissa/Collin County local)
  const afterDiscounts = Math.max(0, subtotal - discount - appliedCredit - pointsDiscount);
  const taxAmount = shippingState === "TX"
    ? Math.round(afterDiscounts * TX_TAX_RATE * 100) / 100
    : 0;
  const finalTotal = Math.max(0, afterDiscounts + taxAmount + shippingCost);

  // All required fields filled before proceeding to Stripe
  const canCheckout = !!(
    shippingState &&
    firstName.trim() &&
    lastName.trim() &&
    addressLine1.trim() &&
    city.trim() &&
    zipCode.trim() &&
    phone.trim()
  );

  const US_STATES = [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" },
  ];

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

  // Fetch available store credits and loyalty points on mount
  useEffect(() => {
    fetch("/api/credits/available")
      .then(r => r.json())
      .then(d => setStoreCredit(d.available || 0))
      .catch(() => {});

    // Fetch loyalty points balance
    fetch("/api/loyalty/history")
      .then(r => r.json())
      .then(d => {
        if (d.current_balance !== undefined) {
          setPointsBalance(d.current_balance || 0);
        }
      })
      .catch(() => {});

    // Fetch admin-configurable shipping settings (falls back to defaults on error)
    fetch("/api/settings/shipping")
      .then(r => r.json())
      .then(d => {
        if (d.free_shipping_threshold !== undefined) setFreeShippingThreshold(d.free_shipping_threshold);
        if (d.standard_shipping_rate !== undefined)  setStandardRate(d.standard_shipping_rate);
        if (d.express_shipping_rate !== undefined)   setExpressRate(d.express_shipping_rate);
      })
      .catch(() => {}); // keep defaults on network error

    // Restore address from localStorage first (survives Stripe redirect + Back button)
    // When the user clicks Back from Stripe, React state is cleared — localStorage keeps it alive
    let localAddressFound = false;
    try {
      const savedLocal = localStorage.getItem("ks_checkout_address");
      if (savedLocal) {
        const a = JSON.parse(savedLocal);
        if (a.shippingState) {
          setShippingState(a.shippingState);
          setFirstName(a.firstName || "");
          setLastName(a.lastName || "");
          setAddressLine1(a.addressLine1 || "");
          setAddressLine2(a.addressLine2 || "");
          setCity(a.city || "");
          setZipCode(a.zipCode || "");
          if (a.phone) setPhone(a.phone);
          localAddressFound = true;
        }
      }
    } catch {}

    // Fetch & auto-populate saved address for logged-in users
    // (only if localStorage had no cached address — avoids overwriting Back-button restore)
    if (!localAddressFound) {
      fetch("/api/user/address")
        .then(r => r.json())
        .then(d => {
          if (d.address) {
            const a = d.address;
            setSavedAddress(a);
            // Auto-populate all fields
            setFirstName(a.firstName || "");
            setLastName(a.lastName || "");
            setAddressLine1(a.addressLine1 || "");
            setAddressLine2(a.addressLine2 || "");
            setCity(a.city || "");
            setZipCode(a.zipCode || "");
            if (a.state) setShippingState(a.state);
            setSavedAddressUsed(true);
          }
          // Pre-fill phone from profile
          if (d.phone) setPhone(d.phone);
        })
        .catch(() => {});
    }
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

  // Calculate max redeemable points (can't exceed what's left after other discounts)
  function getMaxRedeemablePoints() {
    const remainingAfterDiscounts = subtotal - discount - appliedCredit;
    // Points must be multiples of 100 (100 pts = $1)
    const maxFromBalance = Math.floor(pointsBalance / 100) * 100;
    const maxFromTotal = Math.floor(remainingAfterDiscounts) * 100; // points to cover remaining total
    return Math.min(maxFromBalance, maxFromTotal);
  }

  async function toggleLoyaltyPoints(checked: boolean) {
    setUsePoints(checked);
    setPointsError("");

    if (!checked) {
      setPointsToRedeem(0);
      setPointsDiscount(0);
      return;
    }

    // Calculate how many points to apply
    const maxPoints = getMaxRedeemablePoints();
    if (maxPoints < 100) {
      setPointsError("Not enough points to redeem (minimum 100 points = $1).");
      setUsePoints(false);
      return;
    }

    setPointsLoading(true);
    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_to_redeem: maxPoints }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPointsError(data.error || "Could not apply points.");
        setUsePoints(false);
      } else {
        setPointsToRedeem(data.points_to_redeem);
        setPointsDiscount(data.discount_amount);
      }
    } catch {
      setPointsError("Could not apply points. Please try again.");
      setUsePoints(false);
    }
    setPointsLoading(false);
  }

  async function handleCheckout() {
    if (items.length === 0) return;
    if (!canCheckout) { setError("Please fill in all required shipping fields."); return; }
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
          whatsAppPhone: phone.trim(),
          // Loyalty points redemption
          pointsToRedeem: usePoints ? pointsToRedeem : 0,
          pointsDiscount: usePoints ? pointsDiscount : 0,
          // Sales tax + shipping
          shippingState,
          taxAmount,
          shippingCost,
          shippingMethod: freeShipping ? "free" : selectedShipping,
          // Full shipping address (locked — not re-collected on Stripe page)
          shippingAddress: {
            name: `${firstName.trim()} ${lastName.trim()}`,
            line1: addressLine1.trim(),
            line2: addressLine2.trim() || null,
            city: city.trim(),
            state: shippingState,
            zip: zipCode.trim(),
            country: "US",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        // Save address for next time (non-blocking — don't delay checkout)
        fetch("/api/user/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: shippingState,
            zipCode: zipCode.trim(),
            phone: phone.trim(),
          }),
        }).catch(() => {}); // fire-and-forget — never block checkout

        // Persist address in localStorage so the form survives the Stripe redirect.
        // When user hits Back from Stripe, React state is wiped — this restores it.
        try {
          localStorage.setItem("ks_checkout_address", JSON.stringify({
            shippingState,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            zipCode: zipCode.trim(),
            phone: phone.trim(),
          }));
        } catch {}

        // Consent-gated: fires Meta Pixel + TikTok + GTM only if user accepted cookies
        // Apple 5.1.2: no-op on iOS WKWebView (consent auto-declined)
        trackEvent("InitiateCheckout", {
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

        {/* Loyalty Points */}
        {pointsBalance >= 100 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <Star size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Loyalty Points</span>
              <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--gold)", fontWeight: 700 }}>
                {pointsBalance.toLocaleString()} pts
              </span>
            </div>

            {usePoints && pointsDiscount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "8px" }}>
                <Check size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--gold)", margin: 0 }}>
                    {pointsToRedeem.toLocaleString()} Points Applied
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                    Saves {formatPrice(pointsDiscount)} off your order
                  </p>
                </div>
                <button
                  onClick={() => { setUsePoints(false); setPointsToRedeem(0); setPointsDiscount(0); setPointsError(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => toggleLoyaltyPoints(true)}
                  disabled={pointsLoading || getMaxRedeemablePoints() < 100}
                  className="btn-gold-outline"
                  style={{ width: "100%", justifyContent: "center", opacity: getMaxRedeemablePoints() < 100 ? 0.5 : 1 }}
                >
                  {pointsLoading ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Star size={14} />
                  )}
                  Use {Math.min(getMaxRedeemablePoints(), pointsBalance).toLocaleString()} pts — save {formatPrice(Math.floor(Math.min(getMaxRedeemablePoints(), pointsBalance) / 100))}
                </button>
                <p style={{ color: "var(--muted)", fontSize: "0.74rem", marginTop: "0.4rem", textAlign: "center" }}>
                  100 points = $1 off
                </p>
                {pointsError && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>{pointsError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Shipping Destination ── */}
        <div style={{ background: "var(--surface)", border: `1px solid ${!shippingState ? "rgba(245,158,11,0.4)" : "var(--gold-border)"}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <MapPin size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Shipping Destination</span>
            {!shippingState && <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>Required</span>}
          </div>
          <select
            value={shippingState}
            onChange={(e) => setShippingState(e.target.value)}
            className="input-dark"
            style={{ width: "100%" }}
          >
            <option value="">— Select your state —</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>
          {shippingState === "TX" && (
            <p style={{ color: "#f59e0b", fontSize: "0.72rem", margin: "0.4rem 0 0", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              🏛️ Texas sales tax (8.25%) will be applied
            </p>
          )}
        </div>

        {/* ── Shipping Address ── */}
        {shippingState && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <MapPin size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Shipping Address</span>
              {savedAddressUsed && savedAddress && (
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "var(--gold)", fontWeight: 600 }}>
                  <BookmarkCheck size={12} /> Saved address loaded
                </span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name *"
                className="input-dark"
                style={{ width: "100%" }}
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name *"
                className="input-dark"
                style={{ width: "100%" }}
              />
            </div>
            <AddressAutocomplete
              value={addressLine1}
              onChange={setAddressLine1}
              onAddressSelect={(parsed) => {
                setAddressLine1(parsed.line1);
                if (parsed.city)  setCity(parsed.city);
                if (parsed.state) setShippingState(parsed.state);
                if (parsed.zipCode) setZipCode(parsed.zipCode);
                setSavedAddressUsed(false); // mark as manually entered
              }}
              placeholder="Address line 1 *  (start typing for suggestions)"
              className="input-dark"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Address line 2 (optional)"
              className="input-dark"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City *"
                className="input-dark"
                style={{ width: "100%" }}
              />
              <input
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="ZIP code *"
                className="input-dark"
                style={{ width: "100%" }}
                maxLength={5}
              />
            </div>
            {/* State is already selected — show as read-only badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.75rem", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
              <Check size={13} style={{ color: "var(--gold)" }} />
              <span style={{ color: "var(--muted)" }}>State:</span>
              <span style={{ fontWeight: 600 }}>{US_STATES.find(s => s.code === shippingState)?.name} ({shippingState})</span>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)" }}>Selected above</span>
            </div>
            {/* Phone number — required for delivery coordination & WhatsApp */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number * (e.g. +1 555 123 4567)"
              className="input-dark"
              style={{ width: "100%" }}
            />
            <p style={{ color: "var(--muted)", fontSize: "0.68rem", marginTop: "0.3rem" }}>
              Required for delivery coordination &amp; order updates
            </p>
          </div>
        )}

        {/* ── Shipping Method ── */}
        {shippingState && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Truck size={15} style={{ color: "var(--gold)" }} />
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Shipping Method</span>
            </div>
            {freeShipping ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px" }}>
                <Check size={15} style={{ color: "#10b981" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, color: "#10b981" }}>Free Standard Shipping</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>5–10 business days · Orders ${freeShippingThreshold.toFixed(0)}+</p>
                </div>
                <span style={{ fontWeight: 700, color: "#10b981" }}>FREE</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { value: "standard" as const, label: "Standard Shipping", desc: "5–10 business days", price: standardRate },
                  { value: "express" as const, label: "Express Shipping",  desc: "2–4 business days",  price: expressRate },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer",
                      background: selectedShipping === opt.value ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedShipping === opt.value ? "var(--gold-border)" : "rgba(255,255,255,0.06)"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.value}
                      checked={selectedShipping === opt.value}
                      onChange={() => setSelectedShipping(opt.value)}
                      style={{ accentColor: "var(--gold)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{opt.label}</p>
                      <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>{opt.desc}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-playfair)" }}>${opt.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Order Summary ── */}
        {shippingState && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "0 0 1rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order Summary</p>

            {/* Items */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Items ({items.length})</span>
              <span style={{ fontSize: "0.875rem" }}>{formatPrice(subtotal)}</span>
            </div>

            {/* Discounts */}
            {appliedCoupon && discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <span style={{ color: "#10b981", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Tag size={12} /> Coupon ({appliedCoupon.code})
                </span>
                <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: 600 }}>−{formatPrice(discount)}</span>
              </div>
            )}
            {appliedCredit > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <span style={{ color: "#10b981", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Gift size={12} /> Store Credit
                </span>
                <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: 600 }}>−{formatPrice(appliedCredit)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <span style={{ color: "var(--gold)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Star size={12} /> Points ({pointsToRedeem.toLocaleString()} pts)
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--gold)", fontWeight: 600 }}>−{formatPrice(pointsDiscount)}</span>
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.75rem 0" }} />

            {/* Tax */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                Sales Tax {shippingState === "TX" ? "(TX 8.25%)" : `(${shippingState} — $0.00)`}
              </span>
              <span style={{ fontSize: "0.875rem" }}>{shippingState === "TX" ? formatPrice(taxAmount) : "$0.00"}</span>
            </div>

            {/* Shipping */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                Shipping {freeShipping ? "(Standard)" : selectedShipping === "express" ? "(Express)" : "(Standard)"}
              </span>
              <span style={{ fontSize: "0.875rem", color: freeShipping ? "#10b981" : "var(--text)", fontWeight: freeShipping ? 600 : 400 }}>
                {freeShipping ? "FREE" : formatPrice(shippingCost)}
              </span>
            </div>

            {/* Total */}
            <div style={{ borderTop: "1px solid var(--gold-border)", paddingTop: "0.75rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)" }}>
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>
        )}

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
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>📱 Send order updates via WhatsApp</span>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>
                Receive order confirmation, shipping &amp; delivery updates{phone.trim() ? ` on ${phone.trim()}` : ""}
              </p>
            </div>
          </label>
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
          disabled={loading || !canCheckout}
          className="btn-gold"
          style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "1rem", opacity: !canCheckout ? 0.6 : 1 }}
        >
          {loading ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Redirecting to Stripe...
            </>
          ) : !shippingState ? (
            <>
              <MapPin size={16} />
              Select your state to continue
            </>
          ) : !canCheckout ? (
            <>
              <MapPin size={16} />
              Enter shipping address to continue
            </>
          ) : (
            <>
              <Lock size={16} />
              {(appliedCoupon || appliedCredit > 0 || pointsDiscount > 0)
                ? `Pay ${formatPrice(finalTotal)} — Secure Checkout`
                : `Pay ${formatPrice(finalTotal)} — Secure Checkout`}
            </>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
          <Lock size={12} style={{ color: "var(--subtle)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--subtle)" }}>
            SSL encrypted &bull; Powered by Stripe
          </span>
        </div>

        {/* Need help? Crisp chat trigger */}
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && (window as Window & { $crisp?: { push: (args: unknown[]) => void } }).$crisp) {
                (window as Window & { $crisp: { push: (args: unknown[]) => void } }).$crisp.push(["do", "chat:open"]);
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: "0.75rem",
              textDecoration: "underline",
              padding: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            💬 Need help? Chat with us
          </button>
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
