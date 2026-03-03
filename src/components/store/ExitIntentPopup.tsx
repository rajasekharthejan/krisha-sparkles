"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Mail, Phone } from "lucide-react";

const SHOWN_KEY = "ks_exit_shown";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function setCouponCookie(code: string) {
  const expires = new Date(Date.now() + 30 * 60 * 1000).toUTCString(); // 30 min
  document.cookie = `ks_coupon=${code}; path=/; expires=${expires}; SameSite=Lax`;
}

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");

  // Mobile scroll tracking
  const lastScrollY = useRef(0);
  const maxScrollY = useRef(0);
  const mobileTriggered = useRef(false);

  useEffect(() => {
    const lastShown = localStorage.getItem(SHOWN_KEY);
    if (lastShown && Date.now() - parseInt(lastShown) < SEVEN_DAYS) return;

    // Desktop: mouse leaves top of viewport
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY < 5) {
        setVisible(true);
        localStorage.setItem(SHOWN_KEY, Date.now().toString());
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    }

    // Mobile: scroll up >200px after scrolling down >500px
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY > maxScrollY.current) {
        maxScrollY.current = currentY;
      }
      const scrolledDownEnough = maxScrollY.current > 500;
      const scrolledUpEnough = maxScrollY.current - currentY > 200;
      if (scrolledDownEnough && scrolledUpEnough && !mobileTriggered.current) {
        mobileTriggered.current = true;
        setVisible(true);
        localStorage.setItem(SHOWN_KEY, Date.now().toString());
        window.removeEventListener("scroll", handleScroll);
      }
      lastScrollY.current = currentY;
    }

    // Only attach desktop listener on non-touch devices
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function close() {
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        // Use the unique coupon code returned from the API
        const code = data.couponCode || "";
        if (code) {
          setCouponCode(code);
          // Set coupon cookie so checkout can auto-apply it
          setCouponCookie(code);
        }
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.25s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9991,
          width: "min(520px, 100vw)",
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          padding: "2.5rem 2rem 2rem",
          boxShadow: "0 -12px 60px rgba(0,0,0,0.5)",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button
          onClick={close}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            display: "flex",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted)")}
        >
          <X size={20} />
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Sparkles size={24} style={{ color: "var(--gold)" }} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                  lineHeight: 1.2,
                }}
              >
                Wait &mdash; Here&apos;s 15% Off!
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Enter your email &amp; phone to receive a <strong style={{ color: "var(--gold)" }}>unique 15% off code</strong> — yours alone, single-use.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {/* Email */}
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="input-dark"
                  style={{ paddingLeft: "2.5rem", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {/* Phone */}
              <div style={{ position: "relative" }}>
                <Phone
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (e.g. +1 555 123 4567)"
                  required
                  className="input-dark"
                  style={{ paddingLeft: "2.5rem", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !phone.trim()}
                className="btn-gold"
                style={{ width: "100%", justifyContent: "center", fontSize: "1rem", marginTop: "0.25rem" }}
              >
                {loading ? (
                  <span style={{ width: "16px", height: "16px", border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : null}
                {loading ? "Generating your code..." : "Claim My 15% Off ✦"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--subtle)", margin: 0 }}>
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </form>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#127881;</p>
            <h3
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--gold)",
                marginBottom: "0.5rem",
              }}
            >
              You&apos;re In!
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              Your unique 15% off code has been <strong style={{ color: "var(--text)" }}>sent to your email</strong> and auto-applied at checkout:
            </p>
            {couponCode && (
              <div style={{
                background: "rgba(201,168,76,0.06)",
                border: "2px dashed rgba(201,168,76,0.4)",
                borderRadius: "10px",
                padding: "0.75rem 1.5rem",
                display: "inline-block",
                marginBottom: "1.25rem",
              }}>
                <p style={{ fontFamily: "monospace", fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)", margin: 0, letterSpacing: "0.14em" }}>
                  {couponCode}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "4px 0 0" }}>
                  Single-use · Expires in 30 days
                </p>
              </div>
            )}
            <br />
            <button onClick={close} className="btn-gold" style={{ justifyContent: "center" }}>
              Shop Now &#10024;
            </button>
          </div>
        )}
      </div>
    </>
  );
}
