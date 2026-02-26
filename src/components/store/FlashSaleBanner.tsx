"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Flame } from "lucide-react";

interface ActiveCoupon {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  expires_at: string;
}

export default function FlashSaleBanner() {
  const [coupon, setCoupon] = useState<ActiveCoupon | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Respect session dismissal
    if (sessionStorage.getItem("flashBannerDismissed") === "1") {
      setDismissed(true);
      return;
    }
    fetch("/api/active-coupon")
      .then((r) => r.json())
      .then(({ coupon: c }: { coupon: ActiveCoupon | null }) => {
        if (c?.expires_at) setCoupon(c);
      })
      .catch(() => {});
  }, []);

  const tick = useCallback(() => {
    if (!coupon?.expires_at) return;
    const diff = new Date(coupon.expires_at).getTime() - Date.now();
    if (diff <= 0) { setCoupon(null); return; }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setTimeLeft(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    );
  }, [coupon]);

  useEffect(() => {
    if (!coupon?.expires_at) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [coupon, tick]);

  function handleDismiss() {
    sessionStorage.setItem("flashBannerDismissed", "1");
    setDismissed(true);
  }

  if (dismissed || !coupon || !timeLeft) return null;

  const discountLabel =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% off`
      : `$${coupon.discount_value.toFixed(2)} off`;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)",
        backgroundSize: "200% 100%",
        color: "#0a0a0a",
        padding: "0.55rem 3rem 0.55rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.6rem",
        fontSize: "0.825rem",
        fontWeight: 600,
        position: "sticky",
        top: 0,
        zIndex: 39,
        letterSpacing: "0.01em",
        lineHeight: 1.4,
        flexWrap: "wrap",
      }}
    >
      <Flame size={14} style={{ flexShrink: 0 }} />
      <span>
        Flash Sale!&nbsp; Use{" "}
        <span
          style={{
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.14)",
            padding: "0.1em 0.4em",
            borderRadius: "3px",
            letterSpacing: "0.06em",
          }}
        >
          {coupon.code}
        </span>{" "}
        for <strong>{discountLabel}</strong>&nbsp;—&nbsp;ends in{" "}
        <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{timeLeft}</span>
      </span>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss flash sale banner"
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#0a0a0a",
          opacity: 0.6,
          display: "flex",
          alignItems: "center",
          padding: "4px",
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
