"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { validatePassword, getPasswordStrength } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState(false);

  const strength = getPasswordStrength(form.password);
  const passValidation = validatePassword(form.password);

  useEffect(() => {
    // Supabase redirects here with a hash fragment containing the token
    // The client auto-handles the token from the URL hash
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    // Listen for auth state change (token exchange happens automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <CheckCircle size={56} style={{ color: "var(--gold)", marginBottom: "1rem" }} />
          <h2 style={{ fontFamily: "var(--font-playfair)", color: "var(--text)", marginBottom: "0.75rem" }}>Password Updated!</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Your password has been changed successfully. Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <p style={{ color: "var(--muted)" }}>Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "1rem", paddingTop: "80px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.8rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.5rem" }}>
            Set New Password
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Choose a strong new password</p>
        </div>

        <form onSubmit={handleSubmit} className="glass" style={{ padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="input-dark"
                type={showPass ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, uppercase, number, special"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: "100%", paddingRight: "2.5rem" }}
              />
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
            <input
              className="input-dark"
              type={showPass ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              style={{ width: "100%", borderColor: form.confirm && form.confirm !== form.password ? "#ef4444" : "" }}
            />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", padding: "0.75rem", borderRadius: "8px", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            Update Password
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "var(--muted)", fontSize: "0.75rem" }}>
            <ShieldCheck size={13} style={{ color: "var(--gold)" }} />
            Secured with 256-bit encryption
          </div>
        </form>
      </div>
    </div>
  );
}
