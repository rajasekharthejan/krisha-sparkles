"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

export default function BlogNewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're subscribed! 🎁");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again");
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "14px",
        padding: "1.75rem 2rem",
        margin: "2.5rem 0",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>✨</div>
      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.5rem" }}>
        Enjoying this? Get More Styling Tips
      </h3>
      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
        Join 2,000+ jewelry lovers — get exclusive styling guides, new arrivals &amp; a <strong style={{ color: "var(--gold)" }}>10% off</strong> welcome gift.
      </p>

      {status === "success" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#10b981", fontWeight: 600, fontSize: "0.9rem" }}>
          <Check size={18} /> {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", maxWidth: "420px", margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === "loading"}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "0.65rem 1rem",
              background: "var(--elevated)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.25rem",
              background: "linear-gradient(135deg,#c9a84c,#e8c96a)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: status === "loading" ? 0.7 : 1,
            }}
          >
            {status === "loading" ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={15} />}
            Subscribe Free
          </button>
          {status === "error" && (
            <p style={{ width: "100%", color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0", textAlign: "center" }}>{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
