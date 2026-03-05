"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, Loader2, Eye } from "lucide-react";
import HeroSection from "@/components/store/HeroSection";
import type { HeroProps } from "@/components/store/HeroSection";

const LAYOUTS: { id: HeroProps["layout"]; name: string; desc: string }[] = [
  { id: "celestial", name: "Grand Celestial", desc: "Floating gold particles, centered text, radial glow" },
  { id: "split",     name: "Split Showcase",  desc: "Left text, right geometric diamond pattern" },
  { id: "minimal",   name: "Minimal Luxe",    desc: "Oversized typography, pure black, gold rule" },
  { id: "diagonal",  name: "Bold Diagonal",   desc: "Diagonal gold stripe, left-aligned uppercase" },
  { id: "framed",    name: "Elegant Frame",    desc: "Double-border ornamental frame, centered" },
];

const DEFAULTS: HeroProps = {
  layout: "celestial",
  heading: "Adorned in *Gold*, Crafted with *Love*",
  subtext: "Discover our exclusive collection of imitation jewelry & ethnic wear — inspired by Indian tradition, designed for the modern woman.",
  badge: "Handpicked Imitation Jewelry",
  ctaPrimaryText: "Shop Collection",
  ctaPrimaryUrl: "/shop",
  ctaSecondaryText: "Instagram",
  ctaSecondaryUrl: "https://www.instagram.com/krisha_sparkles/",
};

const BUTTON_TEXT_OPTIONS = [
  "Shop Collection",
  "Shop Now",
  "Explore Collection",
  "Browse Catalog",
  "New Arrivals",
  "View All",
  "Shop Jewelry",
  "Shop Dresses",
  "Gift Sets",
  "Instagram",
  "Follow Us",
  "WhatsApp",
  "Contact Us",
  "Learn More",
];

const BUTTON_URL_OPTIONS: { label: string; value: string }[] = [
  { label: "Shop → /shop", value: "/shop" },
  { label: "New Arrivals → /shop?sort=newest", value: "/shop?sort=newest" },
  { label: "Jewelry → /shop?category=necklaces", value: "/shop?category=necklaces" },
  { label: "Dresses → /shop?category=dresses", value: "/shop?category=dresses" },
  { label: "Gift Sets → /bundles", value: "/bundles" },
  { label: "Collections → /collections", value: "/collections" },
  { label: "Blog → /blog", value: "/blog" },
  { label: "Contact → /contact", value: "/contact" },
  { label: "Instagram", value: "https://www.instagram.com/krisha_sparkles/" },
  { label: "WhatsApp", value: "https://wa.me/14694776498" },
  { label: "About → /about", value: "/about" },
];

/* ─── Mini layout preview thumbnails (CSS-only) ─── */
function LayoutThumbnail({ id }: { id: string }) {
  const base: React.CSSProperties = {
    width: "100%", height: "80px", borderRadius: "6px",
    background: "#0a0a0a", position: "relative", overflow: "hidden",
  };
  const line = (w: string, h: string, top: string, left: string, mx?: string): React.CSSProperties => ({
    position: "absolute", width: w, height: h, top, left,
    background: "rgba(201,168,76,0.35)", borderRadius: "2px",
    margin: mx || "0",
  });

  switch (id) {
    case "celestial":
      return (
        <div style={base}>
          {/* center lines + dots */}
          <div style={{ ...line("40%", "3px", "28%", "30%") }} />
          <div style={{ ...line("28%", "2px", "42%", "36%") }} />
          <div style={{ ...line("20%", "2px", "54%", "40%") }} />
          <div style={{ ...line("35%", "2px", "66%", "32%") }} />
          {[15, 25, 70, 80, 45, 60, 35, 85].map((l, i) => (
            <div key={i} style={{ position: "absolute", left: `${l}%`, top: `${10 + (i * 11) % 75}%`, width: "2px", height: "2px", borderRadius: "50%", background: "var(--gold)", opacity: 0.5 }} />
          ))}
        </div>
      );
    case "split":
      return (
        <div style={base}>
          {/* left text lines */}
          <div style={{ ...line("35%", "3px", "25%", "8%") }} />
          <div style={{ ...line("28%", "2px", "40%", "8%") }} />
          <div style={{ ...line("22%", "2px", "52%", "8%") }} />
          <div style={{ ...line("30%", "2px", "64%", "8%") }} />
          {/* vertical divider */}
          <div style={{ position: "absolute", left: "55%", top: "15%", bottom: "15%", width: "1px", background: "rgba(201,168,76,0.3)" }} />
          {/* right diamond */}
          <div style={{ position: "absolute", right: "12%", top: "50%", transform: "translate(0, -50%) rotate(45deg)", width: "28px", height: "28px", border: "1px solid rgba(201,168,76,0.35)" }} />
        </div>
      );
    case "minimal":
      return (
        <div style={base}>
          {/* single huge center line */}
          <div style={{ ...line("55%", "5px", "38%", "22.5%") }} />
          {/* thin gold rule */}
          <div style={{ position: "absolute", top: "58%", left: "30%", width: "40%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }} />
          <div style={{ ...line("25%", "2px", "68%", "37.5%") }} />
        </div>
      );
    case "diagonal":
      return (
        <div style={base}>
          {/* diagonal stripe */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, transparent 35%, rgba(201,168,76,0.12) 35%, rgba(201,168,76,0.12) 65%, transparent 65%)" }} />
          {/* left text lines */}
          <div style={{ ...line("32%", "3px", "25%", "8%") }} />
          <div style={{ ...line("25%", "2px", "42%", "8%") }} />
          <div style={{ ...line("20%", "2px", "54%", "8%") }} />
          <div style={{ ...line("28%", "2px", "68%", "8%") }} />
        </div>
      );
    case "framed":
      return (
        <div style={base}>
          {/* outer frame */}
          <div style={{ position: "absolute", top: "10%", left: "12%", right: "12%", bottom: "10%", border: "1px solid rgba(201,168,76,0.35)" }}>
            {/* inner frame */}
            <div style={{ position: "absolute", inset: "4px", border: "1px solid rgba(201,168,76,0.2)" }} />
          </div>
          {/* center lines */}
          <div style={{ ...line("30%", "3px", "35%", "35%") }} />
          <div style={{ ...line("22%", "2px", "50%", "39%") }} />
          <div style={{ ...line("26%", "2px", "62%", "37%") }} />
        </div>
      );
    default:
      return <div style={base} />;
  }
}

export default function AdminHeroPage() {
  const [settings, setSettings] = useState<HeroProps>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/hero")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings({
            layout: data.layout || DEFAULTS.layout,
            heading: data.heading || DEFAULTS.heading,
            subtext: data.subtext || DEFAULTS.subtext,
            badge: data.badge || DEFAULTS.badge,
            ctaPrimaryText: data.ctaPrimaryText || DEFAULTS.ctaPrimaryText,
            ctaPrimaryUrl: data.ctaPrimaryUrl || DEFAULTS.ctaPrimaryUrl,
            ctaSecondaryText: data.ctaSecondaryText || DEFAULTS.ctaSecondaryText,
            ctaSecondaryUrl: data.ctaSecondaryUrl || DEFAULTS.ctaSecondaryUrl,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  function update(field: keyof HeroProps, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={28} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={24} style={{ color: "var(--gold)" }} />
            Hero Section
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Customize your homepage hero layout and text
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.2rem", borderRadius: "8px",
              background: showPreview ? "var(--gold-muted)" : "transparent",
              border: "1px solid var(--gold-border)", color: "var(--gold)",
              fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Eye size={16} />
            {showPreview ? "Hide Preview" : "Live Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold"
            style={{ fontSize: "0.82rem", borderRadius: "8px", minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <Check size={16} /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div style={{
          marginBottom: "2rem", borderRadius: "12px", overflow: "hidden",
          border: "1px solid var(--gold-border)",
          background: "#0a0a0a", position: "relative",
          height: "400px",
        }}>
          <div style={{
            transform: "scale(0.42)", transformOrigin: "top left",
            width: "238%", height: "238%",
            pointerEvents: "none",
          }}>
            <HeroSection {...settings} />
          </div>
          <div style={{
            position: "absolute", bottom: "0.75rem", right: "0.75rem",
            padding: "0.3rem 0.75rem", borderRadius: "6px",
            background: "rgba(0,0,0,0.7)", border: "1px solid var(--gold-border)",
            fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Preview — {LAYOUTS.find((l) => l.id === settings.layout)?.name}
          </div>
        </div>
      )}

      {/* Layout Picker */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--gold-border)",
        borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem" }}>
          Choose Layout
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          {LAYOUTS.map((layout) => {
            const isActive = settings.layout === layout.id;
            return (
              <button
                key={layout.id}
                onClick={() => update("layout", layout.id)}
                style={{
                  background: isActive ? "var(--gold-muted)" : "var(--elevated)",
                  border: `2px solid ${isActive ? "var(--gold)" : "var(--gold-border)"}`,
                  borderRadius: "12px", padding: "0.75rem",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s", position: "relative",
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: "var(--gold)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={12} style={{ color: "#000" }} />
                  </div>
                )}
                <LayoutThumbnail id={layout.id} />
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: isActive ? "var(--gold)" : "var(--text)", marginTop: "0.6rem", marginBottom: "0.15rem" }}>
                  {layout.name}
                </p>
                <p style={{ fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.4, margin: 0 }}>
                  {layout.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Editor */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--gold-border)",
        borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem" }}>
          Hero Content
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Badge */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Badge Text
            </label>
            <input
              className="input-dark"
              value={settings.badge}
              onChange={(e) => update("badge", e.target.value)}
              placeholder="Handpicked Imitation Jewelry"
              style={{ width: "100%" }}
            />
          </div>

          {/* Heading */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Heading
            </label>
            <input
              className="input-dark"
              value={settings.heading}
              onChange={(e) => update("heading", e.target.value)}
              placeholder="Adorned in *Gold*, Crafted with *Love*"
              style={{ width: "100%" }}
            />
            <p style={{ fontSize: "0.68rem", color: "var(--subtle)", marginTop: "0.35rem" }}>
              Wrap words in <span style={{ color: "var(--gold)", fontWeight: 600 }}>*asterisks*</span> to make them shimmer gold. Commas create line breaks.
            </p>
          </div>

          {/* Subtext */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Subtext
            </label>
            <textarea
              className="input-dark"
              value={settings.subtext}
              onChange={(e) => update("subtext", e.target.value)}
              rows={3}
              placeholder="Describe your store..."
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* Primary CTA */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Primary Button Text
            </label>
            <select
              className="input-dark"
              value={settings.ctaPrimaryText}
              onChange={(e) => update("ctaPrimaryText", e.target.value)}
              style={{ width: "100%", cursor: "pointer" }}
            >
              {BUTTON_TEXT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Primary Button URL
            </label>
            <select
              className="input-dark"
              value={settings.ctaPrimaryUrl}
              onChange={(e) => update("ctaPrimaryUrl", e.target.value)}
              style={{ width: "100%", cursor: "pointer" }}
            >
              {BUTTON_URL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Secondary CTA */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Secondary Button Text
            </label>
            <select
              className="input-dark"
              value={settings.ctaSecondaryText}
              onChange={(e) => update("ctaSecondaryText", e.target.value)}
              style={{ width: "100%", cursor: "pointer" }}
            >
              {BUTTON_TEXT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Secondary Button URL
            </label>
            <select
              className="input-dark"
              value={settings.ctaSecondaryUrl}
              onChange={(e) => update("ctaSecondaryUrl", e.target.value)}
              style={{ width: "100%", cursor: "pointer" }}
            >
              {BUTTON_URL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "2rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold"
          style={{ fontSize: "0.85rem", borderRadius: "8px", minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <Check size={16} /> : null}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Hero Settings"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
