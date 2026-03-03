"use client";
import { useState, useEffect } from "react";
import {
  Settings, Truck, DollarSign, Package, Save, Loader2,
  CheckCircle, AlertCircle, RefreshCw,
} from "lucide-react";

interface ShippingSettings {
  free_shipping_threshold: string;
  standard_shipping_rate: string;
  express_shipping_rate: string;
}

const DEFAULTS: ShippingSettings = {
  free_shipping_threshold: "75",
  standard_shipping_rate: "9.99",
  express_shipping_rate: "14.99",
};

export default function AdminSettingsPage() {
  const [shipping, setShipping] = useState<ShippingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/shipping");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const map: Record<string, string> = {};
      for (const s of data.settings as { key: string; value: string }[]) {
        map[s.key] = s.value;
      }
      setShipping({
        free_shipping_threshold: map.free_shipping_threshold ?? DEFAULTS.free_shipping_threshold,
        standard_shipping_rate:  map.standard_shipping_rate  ?? DEFAULTS.standard_shipping_rate,
        express_shipping_rate:   map.express_shipping_rate   ?? DEFAULTS.express_shipping_rate,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load settings");
    }
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSaveShipping(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          free_shipping_threshold: parseFloat(shipping.free_shipping_threshold),
          standard_shipping_rate:  parseFloat(shipping.standard_shipping_rate),
          express_shipping_rate:   parseFloat(shipping.express_shipping_rate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings");
    }
    setSaving(false);
  }

  function setField(key: keyof ShippingSettings, val: string) {
    setShipping(prev => ({ ...prev, [key]: val }));
  }

  const freeThreshold = parseFloat(shipping.free_shipping_threshold) || 0;
  const standardRate  = parseFloat(shipping.standard_shipping_rate)  || 0;
  const expressRate   = parseFloat(shipping.express_shipping_rate)   || 0;

  // ── styles ──────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--gold-border)",
    borderRadius: "12px",
    padding: "1.75rem",
    marginBottom: "1.5rem",
  };
  const label: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  };
  const inputWrap: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };
  const prefix: React.CSSProperties = {
    position: "absolute",
    left: "0.75rem",
    color: "var(--gold)",
    fontWeight: 700,
    fontSize: "0.9rem",
    pointerEvents: "none",
  };
  const inputStyle: React.CSSProperties = {
    paddingLeft: "1.75rem",
    width: "100%",
  };
  const hint: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--muted)",
    marginTop: "0.35rem",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "720px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: "rgba(201,168,76,0.12)", border: "1px solid var(--gold-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Settings size={18} style={{ color: "var(--gold)" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Store Settings
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
            Configure shipping rates &amp; thresholds — changes go live immediately
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          title="Refresh settings"
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "0.4rem 0.6rem", cursor: "pointer", color: "var(--muted)" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.85rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", marginBottom: "1.5rem", color: "#ef4444", fontSize: "0.875rem" }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.85rem 1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", marginBottom: "1.5rem", color: "#10b981", fontSize: "0.875rem" }}>
          <CheckCircle size={15} />
          Shipping settings saved successfully!
        </div>
      )}

      {/* ── Shipping & Delivery ─────────────────────────────────────────────── */}
      <form onSubmit={handleSaveShipping}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
            <Truck size={16} style={{ color: "var(--gold)" }} />
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              Shipping &amp; Delivery
            </h2>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Loading settings...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Free shipping threshold */}
              <div>
                <label style={label}>
                  <Package size={12} style={{ display: "inline", marginRight: "0.3rem", verticalAlign: "middle" }} />
                  Free Shipping Threshold
                </label>
                <div style={inputWrap}>
                  <span style={prefix}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping.free_shipping_threshold}
                    onChange={e => setField("free_shipping_threshold", e.target.value)}
                    className="input-dark"
                    style={inputStyle}
                    required
                  />
                </div>
                <p style={hint}>
                  Orders with subtotal ≥ ${freeThreshold.toFixed(2)} qualify for free standard shipping.
                  Set to 0 to always offer free shipping.
                </p>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
                <p style={{ ...label, marginBottom: "1rem" }}>
                  <DollarSign size={12} style={{ display: "inline", marginRight: "0.3rem", verticalAlign: "middle" }} />
                  Paid Shipping Rates (shown when order &lt; ${freeThreshold.toFixed(2)})
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {/* Standard */}
                  <div>
                    <label style={{ ...label, marginBottom: "0.4rem" }}>
                      Standard (5–10 days)
                    </label>
                    <div style={inputWrap}>
                      <span style={prefix}>$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shipping.standard_shipping_rate}
                        onChange={e => setField("standard_shipping_rate", e.target.value)}
                        className="input-dark"
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                  {/* Express */}
                  <div>
                    <label style={{ ...label, marginBottom: "0.4rem" }}>
                      Express (2–4 days)
                    </label>
                    <div style={inputWrap}>
                      <span style={prefix}>$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shipping.express_shipping_rate}
                        onChange={e => setField("express_shipping_rate", e.target.value)}
                        className="input-dark"
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Live Preview ─────────────────────────────────────────────────── */}
        {!loading && (
          <div style={{ ...card, background: "rgba(201,168,76,0.04)", marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.85rem" }}>
              Live Preview — what customers see at checkout
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "rgba(16,185,129,0.07)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)" }}>
                <span style={{ color: "var(--muted)" }}>
                  Orders ≥ ${freeThreshold.toFixed(2)}
                </span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>Free Standard Shipping</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "var(--muted)" }}>
                  Orders &lt; ${freeThreshold.toFixed(2)} — Standard (5–10 days)
                </span>
                <span style={{ color: "var(--gold)", fontWeight: 700 }}>${standardRate.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "var(--muted)" }}>
                  Orders &lt; ${freeThreshold.toFixed(2)} — Express (2–4 days)
                </span>
                <span style={{ color: "var(--gold)", fontWeight: 700 }}>${expressRate.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loading}
          className="btn-gold"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem" }}
        >
          {saving ? (
            <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Saving...</>
          ) : (
            <><Save size={15} />Save Shipping Settings</>
          )}
        </button>
      </form>
    </div>
  );
}
