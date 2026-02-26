"use client";

import { useState } from "react";
import { Mail, Sparkles, Loader2 } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0d0800 0%, #1a1000 40%, #0d0800 100%)",
        borderTop: "1px solid var(--gold-border)",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 7s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          right: "-40px",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "float 9s ease-in-out infinite",
          animationDelay: "-4s",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "5rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3rem",
          alignItems: "center",
        }}
        className="newsletter-inner"
      >
        {/* Left: copy */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.25rem 0.85rem",
              background: "var(--gold-muted)",
              border: "1px solid var(--gold-border)",
              borderRadius: "9999px",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={12} />
            Exclusive Members
          </div>

          <h2
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Get{" "}
            <span className="gold-shimmer-text">10% Off</span>
            <br />
            Your First Order
          </h2>

          <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
            Join thousands of jewelry lovers. Get early access to new collections, exclusive discounts, and styling inspiration.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {["Early access to drops", "Members-only deals", "Free styling tips"].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                }}
              >
                <span style={{ color: "var(--gold)", fontSize: "0.7rem" }}>✦</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div>
          {submitted ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem",
                background: "var(--gold-muted)",
                border: "1px solid var(--gold-border)",
                borderRadius: "16px",
                animation: "scaleIn 0.4s ease",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
              <h3
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.25rem",
                  color: "var(--gold)",
                  marginBottom: "0.5rem",
                }}
              >
                You&apos;re in!
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                Check your inbox for your 10% discount code.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--gold-border)",
                borderRadius: "16px",
                padding: "2rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--subtle)",
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
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.78rem", padding: "0.5rem 0.75rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", margin: "0 0 0.25rem" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold"
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  fontSize: "0.875rem",
                  justifyContent: "center",
                  borderRadius: "8px",
                }}
              >
                {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Subscribing...</> : "Claim My 10% Off ✦"}
              </button>

              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--subtle)",
                  marginTop: "0.75rem",
                  textAlign: "center",
                }}
              >
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .newsletter-inner {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            padding: 3rem 1.25rem !important;
          }
        }
      `}</style>
    </section>
  );
}
