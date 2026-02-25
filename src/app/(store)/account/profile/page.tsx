"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    firstName: "", lastName: "", phone: "",
    addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const addr = profile.default_address || {};
        setForm({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          addressLine1: addr.line1 || "",
          addressLine2: addr.line2 || "",
          city: addr.city || "",
          state: addr.state || "",
          postalCode: addr.postal_code || "",
        });
      }
      setLoading(false);
    }

    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim(),
          default_address: {
            line1: form.addressLine1.trim(),
            line2: form.addressLine2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            postal_code: form.postalCode.trim(),
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (upsertError) throw upsertError;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: keyof ProfileForm, type = "text", placeholder = "") => (
    <div>
      <label style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>{label}</label>
      <input
        className="input-dark"
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={{ width: "100%" }}
      />
    </div>
  );

  if (loading) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "2rem" }}>
          <ArrowLeft size={15} /> Back to Account
        </Link>

        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>Edit Profile</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>{email}</p>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", marginBottom: "1.25rem" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {field("First Name", "firstName", "text", "Priya")}
              {field("Last Name", "lastName", "text", "Sharma")}
            </div>
            {field("Phone Number", "phone", "tel", "+1 (555) 000-0000")}
          </div>

          {/* Default Address */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", marginBottom: "1.25rem" }}>Default Shipping Address</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {field("Address Line 1", "addressLine1", "text", "123 Main St")}
              {field("Address Line 2 (optional)", "addressLine2", "text", "Apt 4B")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {field("City", "city", "text", "New York")}
                {field("State", "state", "text", "NY")}
              </div>
              {field("ZIP Code", "postalCode", "text", "10001")}
            </div>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</p>
          )}

          <button type="submit" disabled={saving} className="btn-gold" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <CheckCircle size={16} /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
