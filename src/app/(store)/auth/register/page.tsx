"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { validatePassword, getPasswordStrength } from "@/lib/auth";
import OAuthButtons from "@/components/store/OAuthButtons";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(form.password);
  const passValidation = validatePassword(form.password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passValidation.valid) { setError(passValidation.message!); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { first_name: form.firstName.trim(), last_name: form.lastName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });

      if (signUpError) throw signUpError;

      // Subscribe to newsletter → triggers Welcome email with WELCOME10 code
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), name: fullName }),
      }).catch(() => {});

      // If auto-confirmed (email confirmation disabled), go straight to account
      if (signUpData?.session) {
        router.push("/account");
      } else {
        setDone(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <CheckCircle size={56} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "var(--font-playfair)", color: "var(--text)", marginBottom: "0.75rem" }}>Check Your Email</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            We sent a confirmation link to <strong style={{ color: "var(--text)" }}>{form.email}</strong>.
            Click the link to verify your account, then you can sign in.
          </p>
          <Link href="/auth/login" className="btn-gold" style={{ display: "inline-block", marginTop: "1.5rem" }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem", paddingTop: "80px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.5rem" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--muted)" }}>Join Krisha Sparkles for exclusive access</p>
        </div>

        <div className="glass" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* OAuth buttons */}
          <OAuthButtons redirectTo="/account" />

          {/* Email/password form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>First Name</label>
                <input className="input-dark" required placeholder="Priya" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Last Name</label>
                <input className="input-dark" required placeholder="Sharma" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ width: "100%" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Email Address</label>
              <input className="input-dark" type="email" required autoComplete="email" placeholder="priya@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: "100%" }} />
            </div>

            <div>
              <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input-dark" type={showPass ? "text" : "password"} required autoComplete="new-password" placeholder="Min 8 chars, uppercase, number, special" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: "100%", paddingRight: "2.5rem" }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "3px", marginBottom: "0.3rem" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= strength.score ? strength.color : "rgba(255,255,255,0.1)", transition: "background 0.2s" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: strength.color, margin: 0 }}>{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Confirm Password</label>
              <input className="input-dark" type={showPass ? "text" : "password"} required autoComplete="new-password" placeholder="Re-enter password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} style={{ width: "100%", borderColor: form.confirm && form.confirm !== form.password ? "#ef4444" : "" }} />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", padding: "0.75rem", borderRadius: "8px", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
              Create Account
            </button>
          </form>

          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--gold)" }}>Sign in</Link>
          </p>

          <p style={{ textAlign: "center", margin: 0 }}>
            <Link href="/shop" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Continue as Guest →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
