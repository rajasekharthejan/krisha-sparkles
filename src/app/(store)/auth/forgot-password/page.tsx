"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );
      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem", paddingTop: "80px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link href="/auth/login" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem", textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to login
        </Link>

        {sent ? (
          <div className="glass" style={{ padding: "2.5rem", borderRadius: "16px", textAlign: "center" }}>
            <Mail size={48} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
            <h2 style={{ fontFamily: "var(--font-playfair)", color: "var(--text)", marginBottom: "0.75rem" }}>Email Sent</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              If <strong style={{ color: "var(--text)" }}>{email}</strong> has an account, you&apos;ll receive a password reset link shortly. The link expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.8rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.5rem" }}>
                Reset Password
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Enter your email and we&apos;ll send a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="glass" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Email Address</label>
                <input
                  className="input-dark"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", padding: "0.75rem", borderRadius: "8px", margin: 0 }}>{error}</p>}

              <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                Send Reset Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
