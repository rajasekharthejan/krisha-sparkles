"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, Save, ExternalLink, Sparkles, LayoutTemplate } from "lucide-react";

interface SectionDef {
  key: string;
  label: string;
  desc: string;
  icon: string;
  href: string;
}

const SECTIONS: SectionDef[] = [
  {
    key: "hp_section_categories",
    label: "Shop by Category",
    desc: "Category cards grid — automatically hides empty categories",
    icon: "🏷️",
    href: "/admin/categories",
  },
  {
    key: "hp_section_occasion",
    label: "Shop by Occasion",
    desc: "Occasion cards: Wedding, Party, Daily Wear, Festival, Bridal",
    icon: "🎉",
    href: "",
  },
  {
    key: "hp_section_instagram",
    label: "Discover the Sparkle on Instagram",
    desc: "Instagram feed with Follow button and social proof stats",
    icon: "📸",
    href: "",
  },
  {
    key: "hp_section_newsletter",
    label: "Exclusive Members — Get 10% Off",
    desc: "Newsletter signup section with discount offer",
    icon: "✉️",
    href: "",
  },
];

export default function AdminSectionsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [heroStyle, setHeroStyle] = useState<"classic" | "luxury">("classic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load section toggles
    fetch("/api/admin/sections")
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); });
    // Load hero style setting
    fetch("/api/admin/sections/hero-style")
      .then((r) => r.ok ? r.json() : { style: "classic" })
      .then((d) => setHeroStyle(d.style === "luxury" ? "luxury" : "classic"))
      .catch(() => {});
  }, []);

  function toggle(key: string) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    const [secRes] = await Promise.all([
      fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
      fetch("/api/admin/sections/hero-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: heroStyle }),
      }),
    ]);
    setSaving(false);
    if (secRes.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", paddingTop: "6rem" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--gold)" }} />
      </div>
    );
  }

  const visibleCount = Object.values(settings).filter(Boolean).length;

  return (
    <div style={{ padding: "2rem", maxWidth: "720px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Homepage Sections
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Toggle which sections appear on the public homepage
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none", padding: "0.5rem 0.75rem", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px" }}
          >
            <ExternalLink size={13} /> Preview site
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Status pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)",
        borderRadius: "9999px", padding: "0.35rem 1rem", marginBottom: "1.5rem",
        fontSize: "0.75rem", color: "var(--muted)",
      }}>
        <Eye size={13} style={{ color: "var(--gold)" }} />
        <span><strong style={{ color: "var(--text)" }}>{visibleCount}</strong> of {SECTIONS.length} sections visible</span>
      </div>

      {/* ── Hero Style Picker ── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--gold-border)",
        borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <LayoutTemplate size={16} style={{ color: "var(--gold)" }} />
          <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Hero Style</p>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--subtle)", marginBottom: "1.25rem" }}>
          Choose how the top hero section looks on the homepage
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>

          {/* Classic option */}
          <button
            onClick={() => setHeroStyle("classic")}
            style={{
              padding: "1.1rem 1rem", borderRadius: "10px", cursor: "pointer", textAlign: "left",
              border: `2px solid ${heroStyle === "classic" ? "var(--gold)" : "rgba(201,168,76,0.15)"}`,
              background: heroStyle === "classic" ? "rgba(201,168,76,0.07)" : "var(--elevated)",
              transition: "all 0.2s",
            }}
          >
            {/* Mini preview */}
            <div style={{ width: "100%", height: "56px", borderRadius: "6px", marginBottom: "0.75rem", overflow: "hidden", position: "relative", background: "radial-gradient(ellipse at 50% 40%, #1a0f05, #0a0a0a)" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ height: "6px", width: "60px", background: "rgba(201,168,76,0.5)", borderRadius: "3px", margin: "0 auto 5px" }} />
                <div style={{ height: "4px", width: "40px", background: "rgba(245,245,245,0.2)", borderRadius: "2px", margin: "0 auto 6px" }} />
                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <div style={{ height: "12px", width: "30px", background: "rgba(201,168,76,0.35)", borderRadius: "3px" }} />
                  <div style={{ height: "12px", width: "30px", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "3px" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: heroStyle === "classic" ? "var(--text)" : "var(--muted)" }}>Classic</p>
              {heroStyle === "classic" && <span style={{ fontSize: "0.6rem", background: "var(--gold)", color: "#000", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>Active</span>}
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: 0 }}>Centered text, gold buttons, warm glow effects</p>
          </button>

          {/* Luxury option */}
          <button
            onClick={() => setHeroStyle("luxury")}
            style={{
              padding: "1.1rem 1rem", borderRadius: "10px", cursor: "pointer", textAlign: "left",
              border: `2px solid ${heroStyle === "luxury" ? "var(--gold)" : "rgba(201,168,76,0.15)"}`,
              background: heroStyle === "luxury" ? "rgba(201,168,76,0.07)" : "var(--elevated)",
              transition: "all 0.2s",
            }}
          >
            {/* Mini preview */}
            <div style={{ width: "100%", height: "56px", borderRadius: "6px", marginBottom: "0.75rem", overflow: "hidden", position: "relative", background: "linear-gradient(155deg, #0f0f0f, #0d0a03)" }}>
              <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", fontFamily: "serif", fontSize: "64px", fontWeight: 700, color: "transparent", WebkitTextStroke: "1px rgba(201,168,76,0.07)", lineHeight: 1 }}>K</div>
              <div style={{ position: "absolute", bottom: "10px", left: "12px" }}>
                <div style={{ height: "1px", width: "20px", background: "rgba(201,168,76,0.6)", marginBottom: "5px" }} />
                <div style={{ height: "7px", width: "70px", background: "rgba(245,245,245,0.7)", borderRadius: "2px", marginBottom: "4px" }} />
                <div style={{ height: "4px", width: "45px", background: "rgba(245,245,245,0.15)", borderRadius: "2px" }} />
              </div>
              <div style={{ position: "absolute", right: "10px", bottom: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <div style={{ height: "14px", width: "1px", background: "linear-gradient(to bottom, rgba(201,168,76,0.5), transparent)" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
              <Sparkles size={12} style={{ color: "var(--gold)" }} />
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: heroStyle === "luxury" ? "var(--text)" : "var(--muted)" }}>Luxury Editorial</p>
              {heroStyle === "luxury" && <span style={{ fontSize: "0.6rem", background: "var(--gold)", color: "#000", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>Active</span>}
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: 0 }}>Full-bleed, bottom-left text, bare CTAs — Zara-style</p>
          </button>

        </div>
      </div>

      {/* Section cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {SECTIONS.map((section) => {
          const isOn = settings[section.key] ?? true;
          return (
            <div
              key={section.key}
              style={{
                background: "var(--surface)",
                border: `1px solid ${isOn ? "var(--gold-border)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                transition: "border-color 0.2s, opacity 0.2s",
                opacity: isOn ? 1 : 0.6,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }}>{section.icon}</span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: isOn ? "var(--text)" : "var(--muted)" }}>
                    {section.label}
                  </p>
                  {section.href && (
                    <a
                      href={section.href}
                      style={{ color: "var(--gold)", fontSize: "0.7rem", textDecoration: "none", opacity: 0.7 }}
                    >
                      manage →
                    </a>
                  )}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--subtle)", margin: 0 }}>{section.desc}</p>
              </div>

              {/* Visibility badge */}
              <span style={{
                fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.55rem",
                borderRadius: "9999px", flexShrink: 0,
                background: isOn ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.08)",
                color: isOn ? "#10b981" : "#6b7280",
                border: `1px solid ${isOn ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.12)"}`,
              }}>
                {isOn ? "Visible" : "Hidden"}
              </span>

              {/* Toggle switch */}
              <button
                onClick={() => toggle(section.key)}
                aria-label={isOn ? `Hide ${section.label}` : `Show ${section.label}`}
                style={{
                  flexShrink: 0,
                  width: "48px", height: "26px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  background: isOn ? "var(--gold)" : "rgba(255,255,255,0.12)",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                }}
              >
                <span style={{
                  position: "absolute",
                  top: "3px",
                  left: isOn ? "25px" : "3px",
                  width: "20px", height: "20px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }} />
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--subtle)", textAlign: "center" }}>
        Changes take effect immediately after saving — no deploy needed.
      </p>
    </div>
  );
}
