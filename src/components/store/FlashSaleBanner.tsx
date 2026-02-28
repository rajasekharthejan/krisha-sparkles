"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Flame } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expires_at: string | null;
  banner_text: string | null;
  // Legacy field support
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

const ROTATE_INTERVAL_MS = 5_000;

// Format a single countdown string for a given expiry ISO string.
// Returns empty string if expiry is null or already past.
function formatCountdown(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildDiscountLabel(coupon: Coupon): string {
  // Resolve type and value from new OR legacy schema fields
  const type = coupon.type ?? coupon.discount_type ?? "percentage";
  const value = coupon.value ?? coupon.discount_value ?? 0;
  return type === "percentage" ? `${value}% off` : `$${value.toFixed(2)} off`;
}

export default function FlashSaleBanner() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Map coupon id -> current countdown string (updated every second)
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  const rotateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch banners ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem("flashBannerDismissed") === "1") {
      setDismissed(true);
      return;
    }
    fetch("/api/active-coupons")
      .then((r) => r.json())
      .then(({ coupons: cs }: { coupons: Coupon[] }) => {
        // Only show coupons that are not yet expired
        const active = (cs ?? []).filter((c) => {
          if (!c.expires_at) return true; // no expiry = always active
          return new Date(c.expires_at).getTime() > Date.now();
        });
        setCoupons(active);
      })
      .catch(() => {});
  }, []);

  // ── Countdown tick ────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (coupons.length === 0) return;
    const next: Record<string, string> = {};
    const now = Date.now();
    const expired: string[] = [];
    for (const c of coupons) {
      if (!c.expires_at) {
        next[c.id] = ""; // no timer needed
        continue;
      }
      const diff = new Date(c.expires_at).getTime() - now;
      if (diff <= 0) {
        expired.push(c.id);
      } else {
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        next[c.id] = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
    }
    setCountdowns(next);
    if (expired.length > 0) {
      // Remove expired coupons
      setCoupons((prev) => {
        const filtered = prev.filter((c) => !expired.includes(c.id));
        // Adjust currentIndex if needed
        setCurrentIndex((idx) => Math.min(idx, Math.max(0, filtered.length - 1)));
        return filtered;
      });
    }
  }, [coupons]);

  useEffect(() => {
    if (coupons.length === 0) return;
    tick(); // immediate first paint
    tickTimerRef.current = setInterval(tick, 1_000);
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [coupons, tick]);

  // ── Carousel rotation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (coupons.length <= 1) return;
    rotateTimerRef.current = setInterval(() => {
      setCurrentIndex((idx) => (idx + 1) % coupons.length);
    }, ROTATE_INTERVAL_MS);
    return () => {
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
    };
  }, [coupons.length]);

  function handleDismiss() {
    sessionStorage.setItem("flashBannerDismissed", "1");
    setDismissed(true);
  }

  function goToSlide(index: number) {
    setCurrentIndex(index);
    // Reset rotation timer on manual nav
    if (rotateTimerRef.current) {
      clearInterval(rotateTimerRef.current);
      rotateTimerRef.current = setInterval(() => {
        setCurrentIndex((idx) => (idx + 1) % coupons.length);
      }, ROTATE_INTERVAL_MS);
    }
  }

  if (dismissed || coupons.length === 0) return null;

  const coupon = coupons[currentIndex];
  if (!coupon) return null;

  const timeLeft = coupon.expires_at ? (countdowns[coupon.id] ?? "") : "";
  // If this specific coupon has a timed expiry but timer hasn't fired yet, don't
  // hide it on first render — show when diff > 0
  if (coupon.expires_at && !timeLeft) return null;

  const discountLabel = buildDiscountLabel(coupon);
  const multipleSlides = coupons.length > 1;

  return (
    <div
      role="banner"
      aria-label="Flash sale banner"
      style={{
        background:
          "linear-gradient(90deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)",
        color: "#0a0a0a",
        position: "sticky",
        top: 0,
        zIndex: 39,
        overflow: "hidden",
      }}
    >
      {/* Main content row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          padding: multipleSlides
            ? "0.45rem 3.5rem 0.3rem 1.5rem"
            : "0.55rem 3rem 0.55rem 1.5rem",
          fontSize: "0.825rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          lineHeight: 1.4,
          flexWrap: "wrap",
          position: "relative",
          minHeight: multipleSlides ? "2rem" : undefined,
        }}
      >
        <Flame size={14} style={{ flexShrink: 0 }} />

        <span style={{ textAlign: "center" }}>
          {/* Custom banner_text takes priority over auto-generated label */}
          {coupon.banner_text ? (
            <>
              {coupon.banner_text}&nbsp; — code:{" "}
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
              </span>
              {timeLeft && (
                <>
                  &nbsp;— ends in{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {timeLeft}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
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
              for <strong>{discountLabel}</strong>
              {timeLeft && (
                <>
                  &nbsp;—&nbsp;ends in{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {timeLeft}
                  </span>
                </>
              )}
            </>
          )}
        </span>

        {/* Dismiss button */}
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
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.6")
          }
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress dots (only when multiple banners) */}
      {multipleSlides && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            paddingBottom: "0.35rem",
          }}
        >
          {coupons.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goToSlide(i)}
              aria-label={`Go to banner ${i + 1}`}
              style={{
                width: i === currentIndex ? "18px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background:
                  i === currentIndex ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
