"use client";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight, Copy, Check, Percent, DollarSign, Pencil } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const emptyForm = {
  code: "", description: "", discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "", min_order_amount: "", max_uses: "", expires_at: "", active: true,
};

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, code }));
  }

  function startEdit(coupon: Coupon) {
    // Format datetime-local value from ISO string (strip seconds and timezone)
    const expiresLocal = coupon.expires_at
      ? new Date(coupon.expires_at).toISOString().slice(0, 16)
      : "";
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: coupon.min_order_amount > 0 ? String(coupon.min_order_amount) : "",
      max_uses: coupon.max_uses !== null ? String(coupon.max_uses) : "",
      expires_at: expiresLocal,
      active: coupon.active,
    });
    setEditingId(coupon.id);
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSave() {
    setError("");
    if (!form.code.trim()) return setError("Coupon code is required");
    if (!form.discount_value || Number(form.discount_value) <= 0) return setError("Discount value must be > 0");
    if (form.discount_type === "percentage" && Number(form.discount_value) > 100) return setError("Percentage cannot exceed 100");

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
    };

    if (editingId) {
      // UPDATE existing coupon
      const { error: err } = await supabase.from("coupons").update(payload).eq("id", editingId);
      setSaving(false);
      if (err) return setError(err.message);
    } else {
      // INSERT new coupon
      const { error: err } = await supabase.from("coupons").insert(payload);
      setSaving(false);
      if (err) return setError(err.message.includes("unique") ? "Coupon code already exists" : err.message);
    }

    cancelForm();
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    setCoupons((c) => c.map((x) => x.id === id ? { ...x, active: !active } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    setDeleting(id);
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((c) => c.filter((x) => x.id !== id));
    setDeleting(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalSavings = coupons.reduce((sum, c) => sum + c.uses_count, 0);

  return (
    <div style={{ padding: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Promotions</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} · {totalSavings} total uses</p>
          </div>
          <button onClick={() => { cancelForm(); setShowForm(true); }} className="btn-gold" style={{ fontSize: "0.875rem" }}>
            <Plus size={16} /> New Coupon
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Coupons", value: coupons.length },
            { label: "Active", value: coupons.filter((c) => c.active).length },
            { label: "Total Uses", value: totalSavings },
            { label: "Expired", value: coupons.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "1.75rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                {editingId ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button onClick={cancelForm} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {/* Code */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Coupon Code *</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE20" className="input-dark" style={{ flex: 1, fontFamily: "monospace", letterSpacing: "0.1em" }}
                    readOnly={!!editingId} />
                  {!editingId && (
                    <button onClick={generateCode} title="Generate random code" style={{ padding: "0 0.75rem", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "8px", color: "var(--gold)", cursor: "pointer", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Summer Sale 20% off" className="input-dark" />
              </div>

              {/* Discount Type */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Discount Type *</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["percentage", "fixed"] as const).map((t) => (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, discount_type: t }))}
                      style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: `1px solid ${form.discount_type === t ? "var(--gold)" : "var(--gold-border)"}`, background: form.discount_type === t ? "var(--gold-muted)" : "transparent", color: form.discount_type === t ? "var(--gold)" : "var(--muted)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                      {t === "percentage" ? <Percent size={13} /> : <DollarSign size={13} />}
                      {t === "percentage" ? "%" : "Fixed $"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                  Discount Value * {form.discount_type === "percentage" ? "(0-100%)" : "($)"}
                </label>
                <input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === "percentage" ? "20" : "10.00"} className="input-dark" min="0" max={form.discount_type === "percentage" ? "100" : undefined} step="0.01" />
              </div>

              {/* Min Order */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Min Order Amount ($)</label>
                <input type="number" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="0.00 (no minimum)" className="input-dark" min="0" step="0.01" />
              </div>

              {/* Max Uses */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Max Uses (blank = unlimited)</label>
                <input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Unlimited" className="input-dark" min="1" />
              </div>

              {/* Expiry */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Expires At (blank = never)</label>
                <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="input-dark" />
              </div>

              {/* Active */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem" }}>
                <button onClick={() => setForm((f) => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.active ? "var(--gold)" : "var(--muted)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  {form.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  {form.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button onClick={cancelForm} className="btn-gold-outline" style={{ fontSize: "0.875rem" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-gold" style={{ fontSize: "0.875rem" }}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading...</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
            <Tag size={48} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 1rem", display: "block" }} strokeWidth={1} />
            <p style={{ color: "var(--muted)" }}>No coupons yet. Create your first promotion!</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  const exhausted = c.max_uses !== null && c.uses_count >= c.max_uses;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem", color: "var(--gold)", letterSpacing: "0.08em" }}>{c.code}</span>
                          <button onClick={() => copyCode(c.code)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "2px" }}>
                            {copied === c.code ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} />}
                          </button>
                        </div>
                        {c.description && <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>{c.description}</p>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "1rem" }}>
                          {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "0.3rem" }}>off</span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                        {c.min_order_amount > 0 ? `$${c.min_order_amount.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>
                        <span style={{ color: c.uses_count > 0 ? "var(--text)" : "var(--muted)" }}>{c.uses_count}</span>
                        {c.max_uses && <span style={{ color: "var(--muted)" }}> / {c.max_uses}</span>}
                      </td>
                      <td style={{ color: expired ? "#ef4444" : "var(--muted)", fontSize: "0.8rem" }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never"}
                      </td>
                      <td>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600,
                          background: expired || exhausted || !c.active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          color: expired || exhausted || !c.active ? "#ef4444" : "#10b981" }}>
                          {expired ? "Expired" : exhausted ? "Exhausted" : c.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <button onClick={() => startEdit(c)} title="Edit coupon"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => toggleActive(c.id, c.active)} title={c.active ? "Deactivate" : "Activate"}
                            style={{ background: "none", border: "none", cursor: "pointer", color: c.active ? "var(--gold)" : "var(--muted)" }}>
                            {c.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
