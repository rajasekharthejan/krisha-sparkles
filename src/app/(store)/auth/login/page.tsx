"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import OAuthButtons from "@/components/store/OAuthButtons";

// In-memory rate limiter: 5 attempts per 15 min per session
const attempts: { count: number; resetAt: number } = { count: 0, resetAt: 0 };

function checkRateLimit(): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  if (now > attempts.resetAt) { attempts.count = 0; attempts.resetAt = now + 15 * 60 * 1000; }
  if (attempts.count >= 5) {
    return { allowed: false, waitSeconds: Math.ceil((attempts.resetAt - now) / 1000) };
  }
  return { allowed: true, waitSeconds: 0 };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";
  const oauthError = searchParams.get("error") === "oauth";
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(oauthError ? "Sign-in with social provider failed. Please try again or use email." : "");

  useEffect(() => {
    // If already logged in, redirect
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo);
    });
  }, [redirectTo, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      const mins = Math.ceil(rateCheck.waitSeconds / 60);
      setError(`Too many login attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signInError) {
        attempts.count++;
        if (signInError.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email before signing in. Check your inbox.");
        }
        if (signInError.message.includes("Invalid login credentials")) {
          const remaining = 5 - attempts.count;
          throw new Error(`Invalid email or password.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : " Account temporarily locked."}`);
        }
        throw signInError;
      }

      attempts.count = 0;
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem", paddingTop: "80px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--muted)" }}>Sign in to your Krisha Sparkles account</p>
        </div>

        <div className="glass" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* OAuth buttons */}
          <OAuthButtons redirectTo={redirectTo} />

          {/* Email/password form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Email Address</label>
              <input
                className="input-dark"
                type="email"
                required
                autoComplete="email"
                placeholder="priya@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Password</label>
                <Link href="/auth/forgot-password" style={{ color: "var(--gold)", fontSize: "0.8rem" }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="input-dark"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ width: "100%", paddingRight: "2.5rem" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", padding: "0.75rem", borderRadius: "8px", margin: 0 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
              Sign In
            </button>
          </form>

          {/* Security badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.75rem" }}>
            <ShieldCheck size={13} style={{ color: "var(--gold)" }} />
            Secured with 256-bit encryption
          </div>

          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            No account?{" "}
            <Link href="/auth/register" style={{ color: "var(--gold)" }}>Create one free</Link>
          </p>

          <p style={{ textAlign: "center", margin: 0 }}>
            <Link href="/shop" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
              Continue as Guest →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }} />}>
      <LoginContent />
    </Suspense>
  );
}
