"use client";
import { useState, useEffect } from "react";
import {
  Settings, Truck, DollarSign, Package, Save, Loader2,
  CheckCircle, AlertCircle, RefreshCw, Palette, Check,
  CreditCard, ShieldCheck, AlertTriangle,
} from "lucide-react";

const THEMES = [
  {
    key: "dark",
    name: "Dark Gold",
    desc: "Luxurious black with gold accents — the signature Krisha Sparkles look",
    preview: {
      bg: "#0a0a0a", surface: "#111", text: "#f5f5f5",
      gold: "#c9a84c", muted: "#888",
    },
  },
  {
    key: "pearl",
    name: "Pearl White",
    desc: "Clean white with deep amber — bright, elegant & modern",
    preview: {
      bg: "#faf9f7", surface: "#fff", text: "#1a1410",
      gold: "#96680e", muted: "#6b6260",
    },
  },
  {
    key: "rose",
    name: "Midnight Rose",
    desc: "Deep burgundy with rose gold — romantic & feminine",
    preview: {
      bg: "#130d10", surface: "#1e1118", text: "#f5ede8",
      gold: "#d4836a", muted: "#9e8880",
    },
  },
] as const;

type ThemeKey = typeof THEMES[number]["key"];

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
  // Theme
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("dark");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSuccess, setThemeSuccess] = useState(false);
  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<"test" | "live">("test");
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [modeSaving, setModeSaving] = useState(false);
  const [modeSuccess, setModeSuccess] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const [shippingRes, themeRes, modeRes] = await Promise.all([
        fetch("/api/admin/settings/shipping"),
        fetch("/api/admin/settings/theme"),
        fetch("/api/admin/settings/mode"),
      ]);
      const shippingData = await shippingRes.json();
      if (!shippingRes.ok) throw new Error(shippingData.error || "Failed to load");
      const map: Record<string, string> = {};
      for (const s of shippingData.settings as { key: string; value: string }[]) {
        map[s.key] = s.value;
      }
      setShipping({
        free_shipping_threshold: map.free_shipping_threshold ?? DEFAULTS.free_shipping_threshold,
        standard_shipping_rate:  map.standard_shipping_rate  ?? DEFAULTS.standard_shipping_rate,
        express_shipping_rate:   map.express_shipping_rate   ?? DEFAULTS.express_shipping_rate,
      });
      if (themeRes.ok) {
        const themeData = await themeRes.json();
        setActiveTheme((themeData.theme || "dark") as ThemeKey);
      }
      if (modeRes.ok) {
        const modeData = await modeRes.json();
        setPaymentMode(modeData.mode || "test");
        setEnvStatus(modeData.envStatus || {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load settings");
    }
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSaveTheme(themeKey: ThemeKey) {
    setThemeSaving(true);
    setThemeSuccess(false);
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setActiveTheme(themeKey);
      setThemeSuccess(true);
      setTimeout(() => setThemeSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save theme");
    }
    setThemeSaving(false);
  }

  async function handleModeSwitch(targetMode: "test" | "live") {
    if (targetMode === "live" && !confirmLive) {
      setConfirmLive(true);
      return;
    }
    setConfirmLive(false);
    setModeSaving(true);
    setModeSuccess(false);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Switch failed");
      setPaymentMode(targetMode);
      setEnvStatus(data.envStatus || envStatus);
      setModeSuccess(true);
      setTimeout(() => setModeSuccess(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch payment mode");
    }
    setModeSaving(false);
  }

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

      {/* ── Theme Picker ────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <Palette size={16} style={{ color: "var(--gold)" }} />
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            Store Theme
          </h2>
          {themeSuccess && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem", color: "#10b981", fontSize: "0.8rem" }}>
              <CheckCircle size={13} /> Theme updated! Refresh the store to see it.
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
          {THEMES.map((t) => {
            const isActive = activeTheme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleSaveTheme(t.key)}
                disabled={themeSaving}
                style={{
                  position: "relative",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: `2px solid ${isActive ? t.preview.gold : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                  cursor: themeSaving ? "wait" : "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                  opacity: themeSaving && !isActive ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {/* Active check */}
                {isActive && (
                  <div style={{
                    position: "absolute", top: "0.5rem", right: "0.5rem",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: t.preview.gold,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={11} style={{ color: "#0a0a0a" }} />
                  </div>
                )}

                {/* Mini preview */}
                <div style={{
                  width: "100%", height: "64px", borderRadius: "8px",
                  background: t.preview.bg, border: `1px solid ${t.preview.gold}40`,
                  marginBottom: "0.75rem", position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column", padding: "8px",
                  gap: "4px",
                }}>
                  {/* Simulated nav bar */}
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <div style={{ width: "28px", height: "4px", borderRadius: "2px", background: t.preview.gold }} />
                    <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: t.preview.muted, opacity: 0.4 }} />
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: t.preview.surface, border: `1px solid ${t.preview.gold}60` }} />
                  </div>
                  {/* Simulated product card */}
                  <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ flex: 1, height: "28px", borderRadius: "4px", background: t.preview.surface, border: `1px solid ${t.preview.gold}30` }}>
                        <div style={{ height: "3px", borderRadius: "2px", background: t.preview.gold, margin: "5px 4px 0", opacity: 0.7 }} />
                        <div style={{ height: "2px", borderRadius: "2px", background: t.preview.muted, margin: "3px 4px", opacity: 0.3 }} />
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ fontWeight: 700, fontSize: "0.85rem", margin: "0 0 2px", color: "var(--text)" }}>{t.name}</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{t.desc}</p>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.85rem" }}>
          💡 Theme applies to the customer-facing store instantly. Admin panel always stays dark.
          {themeSaving && <span style={{ marginLeft: "0.5rem" }}><Loader2 size={12} style={{ display: "inline", animation: "spin 1s linear infinite" }} /> Saving...</span>}
        </p>
      </div>

      {/* ── Payment Mode Toggle ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <CreditCard size={16} style={{ color: "var(--gold)" }} />
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            Payment Mode
          </h2>
          {modeSuccess && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem", color: "#10b981", fontSize: "0.8rem" }}>
              <CheckCircle size={13} /> Mode switched successfully!
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
          {/* Test Mode Button */}
          <button
            onClick={() => { setConfirmLive(false); handleModeSwitch("test"); }}
            disabled={modeSaving || paymentMode === "test"}
            style={{
              padding: "1.25rem",
              borderRadius: "12px",
              border: `2px solid ${paymentMode === "test" ? "#f59e0b" : "rgba(255,255,255,0.1)"}`,
              background: paymentMode === "test" ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.01)",
              cursor: paymentMode === "test" ? "default" : "pointer",
              textAlign: "left",
              position: "relative",
              transition: "all 0.2s",
            }}
          >
            {paymentMode === "test" && (
              <div style={{
                position: "absolute", top: "0.6rem", right: "0.6rem",
                width: "22px", height: "22px", borderRadius: "50%",
                background: "#f59e0b",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={12} style={{ color: "#0a0a0a" }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>Test Mode</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Uses test API keys for Stripe &amp; Shippo. No real payments or shipments.
            </p>
          </button>

          {/* Live Mode Button */}
          <button
            onClick={() => handleModeSwitch("live")}
            disabled={modeSaving || paymentMode === "live"}
            style={{
              padding: "1.25rem",
              borderRadius: "12px",
              border: `2px solid ${paymentMode === "live" ? "#10b981" : "rgba(255,255,255,0.1)"}`,
              background: paymentMode === "live" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.01)",
              cursor: paymentMode === "live" ? "default" : "pointer",
              textAlign: "left",
              position: "relative",
              transition: "all 0.2s",
            }}
          >
            {paymentMode === "live" && (
              <div style={{
                position: "absolute", top: "0.6rem", right: "0.6rem",
                width: "22px", height: "22px", borderRadius: "50%",
                background: "#10b981",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={12} style={{ color: "#0a0a0a" }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <ShieldCheck size={16} style={{ color: "#10b981" }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>Live Mode</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Uses real API keys. Real payments &amp; shipments will be processed.
            </p>
          </button>
        </div>

        {/* Confirmation dialog for switching to live */}
        {confirmLive && (
          <div style={{
            padding: "1rem 1.25rem",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            marginBottom: "1rem",
          }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#ef4444", margin: "0 0 0.5rem" }}>
              Are you sure you want to switch to LIVE mode?
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 0.75rem" }}>
              Real payments will be charged to real credit cards. Only switch when you are ready to accept orders.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleModeSwitch("live")}
                disabled={modeSaving}
                className="btn-gold"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}
              >
                {modeSaving ? "Switching..." : "Yes, switch to LIVE"}
              </button>
              <button
                onClick={() => setConfirmLive(false)}
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8rem",
                  background: "none",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "8px",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Env var status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--muted)" }}>
            {envStatus.stripeTest ? <CheckCircle size={11} style={{ color: "#10b981" }} /> : <AlertCircle size={11} style={{ color: "#ef4444" }} />}
            Stripe Test Keys
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--muted)" }}>
            {envStatus.stripeLive ? <CheckCircle size={11} style={{ color: "#10b981" }} /> : <AlertCircle size={11} style={{ color: "#6b7280" }} />}
            Stripe Live Keys
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--muted)" }}>
            {envStatus.shippoTest ? <CheckCircle size={11} style={{ color: "#10b981" }} /> : <AlertCircle size={11} style={{ color: "#ef4444" }} />}
            Shippo Test Key
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--muted)" }}>
            {envStatus.shippoLive ? <CheckCircle size={11} style={{ color: "#10b981" }} /> : <AlertCircle size={11} style={{ color: "#6b7280" }} />}
            Shippo Live Key
          </div>
        </div>

        <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.75rem" }}>
          {modeSaving && <><Loader2 size={11} style={{ display: "inline", animation: "spin 1s linear infinite" }} /> Switching mode...</>}
          {!modeSaving && <>Add <code style={{ fontSize: "0.68rem", color: "var(--gold)" }}>_LIVE</code> suffixed env vars in Vercel to enable live mode.</>}
        </p>
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
