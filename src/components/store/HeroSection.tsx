"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

export interface HeroProps {
  layout: "celestial" | "split" | "minimal" | "diagonal" | "framed" | "luxury" | "blossom";
  heading: string;
  subtext: string;
  badge: string;
  ctaPrimaryText: string;
  ctaPrimaryUrl: string;
  ctaSecondaryText: string;
  ctaSecondaryUrl: string;
}

/* ─── Helper: parse *shimmer* and comma line-breaks ─── */
function parseHeading(text: string): ReactNode[] {
  // Split by comma for line breaks, then parse *shimmer* within each segment
  const lines = text.split(",").map((s) => s.trim());
  const result: ReactNode[] = [];
  lines.forEach((line, li) => {
    const parts = line.split("*");
    parts.forEach((part, pi) => {
      if (pi % 2 === 1) {
        result.push(<span key={`${li}-${pi}`} className="gold-shimmer-text">{part}</span>);
      } else if (part) {
        result.push(part);
      }
    });
    if (li < lines.length - 1) result.push(<br key={`br-${li}`} />);
  });
  return result;
}

/* ─── CTA Buttons shared by all layouts ─── */
function CTAButtons({
  primaryText, primaryUrl, secondaryText, secondaryUrl, justify = "center",
}: {
  primaryText: string; primaryUrl: string;
  secondaryText: string; secondaryUrl: string;
  justify?: "center" | "flex-start";
}) {
  const isExternal = secondaryUrl.startsWith("http");
  return (
    <div style={{ display: "flex", gap: "1rem", justifyContent: justify, flexWrap: "wrap" }}>
      <Link href={primaryUrl} className="btn-gold" style={{ fontSize: "0.875rem", borderRadius: "6px" }}>
        {primaryText} <ArrowRight size={16} />
      </Link>
      {isExternal ? (
        <a href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="btn-gold-outline" style={{ fontSize: "0.875rem", borderRadius: "6px" }}>
          {secondaryText}
        </a>
      ) : (
        <Link href={secondaryUrl} className="btn-gold-outline" style={{ fontSize: "0.875rem", borderRadius: "6px" }}>
          {secondaryText}
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 1: Grand Celestial (default — particles + centered text)
   ═══════════════════════════════════════════════════════════════════ */
function CelestialHero(p: HeroProps) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "radial-gradient(ellipse at 50% 40%, #1a0f05 0%, #0a0a0a 60%)" }}>
      {/* Animated BG */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "15%", left: "8%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 70%)", borderRadius: "50%", animation: "float 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "8%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)", borderRadius: "50%", animation: "float 9s ease-in-out infinite", animationDelay: "-4s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {[...Array(24)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${5 + (i * 4) % 90}%`, top: `${8 + (i * 7) % 82}%`, width: i % 3 === 0 ? "3px" : "2px", height: i % 3 === 0 ? "3px" : "2px", background: i % 4 === 0 ? "var(--gold-light)" : "var(--gold)", borderRadius: "50%", opacity: 0.25 + (i % 5) * 0.12, animation: `float ${3 + (i % 4)}s ease-in-out infinite`, animationDelay: `${(i * 0.35) % 4}s`, boxShadow: "0 0 6px var(--gold)" }} />
        ))}
      </div>
      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 1.5rem", maxWidth: "820px" }}>
        <div className="badge-gold" style={{ marginBottom: "1.5rem", display: "inline-flex", animation: "slideUp 0.6s ease 0.2s both" }}>
          ✦ {p.badge}
        </div>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.75rem, 9vw, 5.5rem)", fontWeight: 700, lineHeight: 1.08, marginBottom: "1.5rem", animation: "slideUp 0.7s ease 0.35s both" }}>
          {parseHeading(p.heading)}
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)", color: "var(--muted)", maxWidth: "520px", margin: "0 auto 2.5rem", lineHeight: 1.8, animation: "slideUp 0.6s ease 0.55s both" }}>
          {p.subtext}
        </p>
        <div style={{ animation: "slideUp 0.6s ease 0.7s both" }}>
          <CTAButtons primaryText={p.ctaPrimaryText} primaryUrl={p.ctaPrimaryUrl} secondaryText={p.ctaSecondaryText} secondaryUrl={p.ctaSecondaryUrl} />
        </div>
      </div>
      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", animation: "float 2.5s ease-in-out infinite" }}>
        <div style={{ width: "1px", height: "50px", background: "linear-gradient(to bottom, var(--gold), transparent)" }} />
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase" }}>Scroll</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 2: Split Showcase (left text, right decorative pattern)
   ═══════════════════════════════════════════════════════════════════ */
function SplitHero(p: HeroProps) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", overflow: "hidden", background: "#0a0a0a" }}>
      {/* Subtle diagonal line pattern on left */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(201,168,76,0.02) 40px, rgba(201,168,76,0.02) 41px)", backgroundSize: "56px 56px" }} />
      <div className="hero-split-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2rem", maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", width: "100%", position: "relative", zIndex: 10 }}>
        {/* Left — Text */}
        <div className="hero-split-text" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: "1.5rem" }}>
          <div className="badge-gold" style={{ animation: "slideUp 0.5s ease 0.2s both" }}>✦ {p.badge}</div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1, animation: "slideUp 0.6s ease 0.3s both" }}>
            {parseHeading(p.heading)}
          </h1>
          <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--muted)", maxWidth: "480px", lineHeight: 1.8, animation: "slideUp 0.5s ease 0.45s both" }}>
            {p.subtext}
          </p>
          <div style={{ animation: "slideUp 0.5s ease 0.6s both" }}>
            <CTAButtons primaryText={p.ctaPrimaryText} primaryUrl={p.ctaPrimaryUrl} secondaryText={p.ctaSecondaryText} secondaryUrl={p.ctaSecondaryUrl} justify="flex-start" />
          </div>
        </div>
        {/* Right — Decorative geometric */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {/* Vertical gold divider */}
          <div style={{ position: "absolute", left: "-1rem", top: "10%", bottom: "10%", width: "1px", background: "linear-gradient(to bottom, transparent, var(--gold), transparent)" }} />
          {/* Diamond frame */}
          <div style={{ width: "280px", height: "280px", position: "relative", animation: "float 6s ease-in-out infinite" }}>
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(201,168,76,0.35)", transform: "rotate(45deg)", borderRadius: "4px" }} />
            <div style={{ position: "absolute", inset: "20px", border: "1px solid rgba(201,168,76,0.2)", transform: "rotate(45deg)", borderRadius: "4px" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120px", height: "120px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.25)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "60px", height: "60px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.15), transparent)" }} />
            {/* 4 tiny dots at compass points */}
            {[0, 90, 180, 270].map((deg) => (
              <div key={deg} style={{ position: "absolute", top: "50%", left: "50%", width: "4px", height: "4px", borderRadius: "50%", background: "var(--gold)", transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-70px)`, opacity: 0.6 }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 3: Minimal Luxe (typography-focused, ultra clean)
   ═══════════════════════════════════════════════════════════════════ */
function MinimalHero(p: HeroProps) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#0a0a0a" }}>
      <div style={{ textAlign: "center", padding: "0 2rem", maxWidth: "1000px", position: "relative", zIndex: 10 }}>
        <p style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "2.5rem", fontWeight: 500, animation: "slideUp 0.5s ease 0.2s both" }}>
          ✦ {p.badge} ✦
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(3.5rem, 12vw, 8rem)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: "0", animation: "slideUp 0.7s ease 0.35s both" }}>
          {parseHeading(p.heading)}
        </h1>
        {/* Gold fading horizontal rule */}
        <div style={{ width: "100%", maxWidth: "400px", height: "1px", margin: "2.5rem auto", background: "linear-gradient(90deg, transparent, var(--gold), transparent)", animation: "slideUp 0.5s ease 0.5s both" }} />
        <p style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)", color: "var(--muted)", maxWidth: "500px", margin: "0 auto 3rem", lineHeight: 1.9, letterSpacing: "0.02em", animation: "slideUp 0.5s ease 0.6s both" }}>
          {p.subtext}
        </p>
        <div style={{ animation: "slideUp 0.5s ease 0.7s both" }}>
          <CTAButtons primaryText={p.ctaPrimaryText} primaryUrl={p.ctaPrimaryUrl} secondaryText={p.ctaSecondaryText} secondaryUrl={p.ctaSecondaryUrl} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 4: Bold Diagonal (asymmetric, modern, diagonal stripe)
   ═══════════════════════════════════════════════════════════════════ */
function DiagonalHero(p: HeroProps) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", overflow: "hidden", background: "#0a0a0a" }}>
      {/* Diagonal gold stripes */}
      <div className="hero-diagonal-stripe" />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(165deg, transparent 32%, rgba(201,168,76,0.04) 32%, rgba(201,168,76,0.04) 34%, transparent 34%)" }} />
      {/* Gold accent diamonds */}
      {[
        { top: "18%", right: "22%", size: 10 },
        { top: "65%", right: "35%", size: 7 },
        { top: "40%", right: "15%", size: 5 },
      ].map((d, i) => (
        <div key={i} style={{ position: "absolute", top: d.top, right: d.right, width: `${d.size}px`, height: `${d.size}px`, background: "var(--gold)", transform: "rotate(45deg)", opacity: 0.35, animation: `float ${4 + i}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }} />
      ))}
      {/* Bottom-right gold arc */}
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "200px", height: "200px", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "50%", pointerEvents: "none" }} />
      {/* Content — left aligned */}
      <div style={{ position: "relative", zIndex: 10, padding: "0 2rem", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ maxWidth: "620px" }}>
          <div className="badge-gold" style={{ marginBottom: "1.5rem", display: "inline-flex", animation: "slideUp 0.5s ease 0.2s both" }}>
            ✦ {p.badge}
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.75rem, 8vw, 5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "1.5rem", animation: "slideUp 0.6s ease 0.35s both" }}>
            {parseHeading(p.heading)}
          </h1>
          <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--muted)", maxWidth: "480px", lineHeight: 1.8, marginBottom: "2.5rem", animation: "slideUp 0.5s ease 0.5s both" }}>
            {p.subtext}
          </p>
          <div style={{ animation: "slideUp 0.5s ease 0.65s both" }}>
            <CTAButtons primaryText={p.ctaPrimaryText} primaryUrl={p.ctaPrimaryUrl} secondaryText={p.ctaSecondaryText} secondaryUrl={p.ctaSecondaryUrl} justify="flex-start" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 5: Elegant Frame (double-border ornamental frame)
   ═══════════════════════════════════════════════════════════════════ */
function FramedHero(p: HeroProps) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: "600px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.04) 0%, #0a0a0a 70%)" }}>
      <div style={{ position: "relative", zIndex: 10, padding: "0 2rem", maxWidth: "780px", width: "100%" }}>
        {/* Outer frame */}
        <div className="hero-frame-outer">
          {/* Corner L-brackets */}
          <div className="hero-corner hero-corner-tl" />
          <div className="hero-corner hero-corner-tr" />
          <div className="hero-corner hero-corner-bl" />
          <div className="hero-corner hero-corner-br" />
          {/* Inner frame */}
          <div className="hero-frame-inner" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "2rem", fontWeight: 500, animation: "slideUp 0.5s ease 0.2s both" }}>
              ✦ {p.badge} ✦
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 600, lineHeight: 1.12, marginBottom: "1.5rem", animation: "slideUp 0.6s ease 0.35s both" }}>
              {parseHeading(p.heading)}
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)", color: "var(--muted)", maxWidth: "480px", margin: "0 auto 2.5rem", lineHeight: 1.8, animation: "slideUp 0.5s ease 0.5s both" }}>
              {p.subtext}
            </p>
            <div style={{ animation: "slideUp 0.5s ease 0.65s both" }}>
              <CTAButtons primaryText={p.ctaPrimaryText} primaryUrl={p.ctaPrimaryUrl} secondaryText={p.ctaSecondaryText} secondaryUrl={p.ctaSecondaryUrl} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 6: Luxury Editorial (Zara-inspired — full-bleed, bottom-left)
   ═══════════════════════════════════════════════════════════════════ */
function LuxuryHero(p: HeroProps) {
  return (
    <section style={{
      position: "relative",
      height: "100vh",
      minHeight: "640px",
      display: "flex",
      alignItems: "flex-end",
      overflow: "hidden",
      background: "#0a0a0a",
    }}>

      {/* ── Dark editorial background gradient ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(155deg, #0f0f0f 0%, #0a0808 45%, #0d0a03 100%)",
      }} />

      {/* ── Grain texture for premium depth ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", opacity: 0.55,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
      }} />

      {/* ── Top hairline gold accent ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px", zIndex: 10,
        background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.5) 25%, rgba(201,168,76,0.5) 75%, transparent 100%)",
      }} />

      {/* ── Oversized decorative watermark letter ── */}
      <div style={{
        position: "absolute", right: "-0.05em", top: "50%",
        transform: "translateY(-50%)",
        fontFamily: "var(--font-playfair)",
        fontSize: "clamp(22rem, 38vw, 50rem)",
        fontWeight: 700,
        color: "transparent",
        WebkitTextStroke: "1px rgba(201,168,76,0.045)",
        lineHeight: 1,
        pointerEvents: "none", userSelect: "none",
        zIndex: 2, letterSpacing: "-0.05em",
      }}>K</div>

      {/* ── Thin vertical right accent line ── */}
      <div style={{
        position: "absolute", right: "clamp(1.5rem, 5vw, 5rem)",
        top: "15%", bottom: "15%", width: "1px", zIndex: 4,
        background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.18) 30%, rgba(201,168,76,0.18) 70%, transparent)",
      }} />

      {/* ── Scroll indicator — rotated text + animated line ── */}
      <div style={{
        position: "absolute", bottom: "3rem",
        right: "clamp(1.25rem, 4.5vw, 4.5rem)",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: "0.85rem", zIndex: 10,
      }}>
        <span style={{
          fontSize: "0.5rem", letterSpacing: "0.45em",
          color: "rgba(245,245,245,0.28)", textTransform: "uppercase",
          writingMode: "vertical-rl", textOrientation: "mixed",
        }}>Scroll</span>
        <div style={{
          width: "1px", height: "55px",
          background: "linear-gradient(to bottom, rgba(201,168,76,0.55), transparent)",
          animation: "float 2.2s ease-in-out infinite",
        }} />
      </div>

      {/* ── Main editorial content — bottom left ── */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "0 clamp(1.75rem, 6vw, 6rem)",
        paddingBottom: "clamp(4rem, 11vh, 8rem)",
        maxWidth: "820px", width: "100%",
      }}>
        {/* Collection label */}
        <p style={{
          fontSize: "0.62rem", letterSpacing: "0.5em",
          textTransform: "uppercase", color: "var(--gold)",
          marginBottom: "1.25rem", fontWeight: 400,
          animation: "slideUp 0.7s ease 0.1s both",
        }}>
          ✦ &nbsp;{p.badge}
        </p>

        {/* Short gold rule above heading */}
        <div style={{
          width: "2.75rem", height: "1px",
          background: "var(--gold)", marginBottom: "1.5rem",
          opacity: 0.65, animation: "slideUp 0.7s ease 0.2s both",
        }} />

        {/* The big headline */}
        <h1 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "clamp(2.75rem, 9.5vw, 6.5rem)",
          fontWeight: 400,
          lineHeight: 1.0,
          letterSpacing: "-0.025em",
          marginBottom: "2rem",
          color: "var(--text)",
          animation: "slideUp 0.8s ease 0.3s both",
        }}>
          {parseHeading(p.heading)}
        </h1>

        {/* Subtext — thin, airy */}
        <p style={{
          fontSize: "0.82rem", letterSpacing: "0.06em",
          color: "rgba(245,245,245,0.4)",
          maxWidth: "360px", lineHeight: 2.0,
          marginBottom: "2.75rem", fontWeight: 300,
          animation: "slideUp 0.7s ease 0.45s both",
        }}>
          {p.subtext}
        </p>

        {/* Bare editorial CTA — no button, just underlined text */}
        <div style={{
          display: "flex", alignItems: "center", gap: "2rem",
          animation: "slideUp 0.7s ease 0.6s both",
        }}>
          <Link href={p.ctaPrimaryUrl} style={{
            display: "inline-flex", alignItems: "center", gap: "0.85rem",
            fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase",
            color: "var(--text)", textDecoration: "none",
            borderBottom: "1px solid rgba(201,168,76,0.4)",
            paddingBottom: "0.3rem",
            transition: "color 0.25s, border-color 0.25s",
          }}>
            {p.ctaPrimaryText}
            <span style={{ color: "var(--gold)", fontSize: "1rem" }}>→</span>
          </Link>
          {p.ctaSecondaryText && (
            <Link href={p.ctaSecondaryUrl} style={{
              fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase",
              color: "rgba(245,245,245,0.35)", textDecoration: "none",
              transition: "color 0.25s",
            }}>
              {p.ctaSecondaryText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT 7: Blossom Garden (ivory-blush, split, rose gold, circular)
   ═══════════════════════════════════════════════════════════════════ */
function BlossomHero(p: HeroProps) {
  const isExternalSecondary = p.ctaSecondaryUrl.startsWith("http");
  return (
    <section style={{
      position: "relative",
      height: "100vh",
      minHeight: "640px",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      background: "radial-gradient(ellipse at 28% 55%, #fdf8f3 0%, #f7ede5 42%, #ede0d4 100%)",
    }}>

      {/* ── Subtle paper-grain overlay ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.45, zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`,
      }} />

      {/* ── Scattered rose-gold ornamental dots ── */}
      {[
        { top: "9%",  left: "56%" }, { top: "16%", left: "63%" },
        { top: "6%",  left: "74%" }, { top: "13%", left: "83%" },
        { top: "24%", left: "90%" }, { top: "76%", left: "58%" },
        { top: "84%", left: "70%" }, { top: "70%", left: "79%" },
        { top: "89%", left: "87%" }, { top: "52%", left: "93%" },
      ].map((dot, i) => (
        <div key={i} style={{
          position: "absolute", top: dot.top, left: dot.left, zIndex: 1,
          width: i % 3 === 0 ? "5px" : "3px", height: i % 3 === 0 ? "5px" : "3px",
          borderRadius: "50%",
          background: i % 2 === 0 ? "rgba(180,110,90,0.28)" : "rgba(180,110,90,0.14)",
          animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
          animationDelay: `${i * 0.35}s`,
        }} />
      ))}

      {/* ── Top accent line ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px", zIndex: 10,
        background: "linear-gradient(90deg, transparent 0%, rgba(180,110,90,0.4) 30%, rgba(180,110,90,0.4) 70%, transparent 100%)",
      }} />

      {/* ── Main grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 clamp(1.5rem, 5vw, 5rem)",
        width: "100%",
        position: "relative",
        zIndex: 10,
        alignItems: "center",
        gap: "clamp(2rem, 5vw, 5rem)",
      }}>

        {/* LEFT ── Text column */}
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Badge with side rules */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            marginBottom: "1.75rem",
            animation: "slideUp 0.6s ease 0.1s both",
          }}>
            <div style={{ width: "2.25rem", height: "1px", background: "rgba(180,110,90,0.55)", flexShrink: 0 }} />
            <p style={{
              fontSize: "0.62rem", letterSpacing: "0.42em",
              textTransform: "uppercase", color: "#b8756a",
              fontWeight: 600, margin: 0, whiteSpace: "nowrap",
            }}>
              {p.badge}
            </p>
            <div style={{ width: "2.25rem", height: "1px", background: "rgba(180,110,90,0.55)", flexShrink: 0 }} />
          </div>

          {/* Main heading — italic serif, deep wine */}
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2.6rem, 6vw, 5.25rem)",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.08,
            color: "#2a1215",
            marginBottom: "1.75rem",
            animation: "slideUp 0.75s ease 0.25s both",
          }}>
            {parseHeading(p.heading)}
          </h1>

          {/* Ornamental divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            marginBottom: "1.75rem",
            animation: "slideUp 0.6s ease 0.4s both",
          }}>
            <div style={{ width: "55px", height: "1px", background: "linear-gradient(90deg, #b8756a, rgba(184,117,106,0.2))" }} />
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#b8756a", opacity: 0.65 }} />
            <div style={{ width: "28px", height: "1px", background: "rgba(180,110,90,0.25)" }} />
          </div>

          {/* Subtext — dusty mauve */}
          <p style={{
            fontSize: "clamp(0.88rem, 1.5vw, 1.02rem)",
            color: "#7a5a5a",
            maxWidth: "400px",
            lineHeight: 1.9,
            marginBottom: "2.75rem",
            animation: "slideUp 0.6s ease 0.5s both",
            fontWeight: 400,
          }}>
            {p.subtext}
          </p>

          {/* CTAs — wine + outline */}
          <div style={{
            display: "flex", gap: "1rem", flexWrap: "wrap",
            animation: "slideUp 0.6s ease 0.65s both",
          }}>
            <Link href={p.ctaPrimaryUrl} style={{
              background: "#2a1215",
              color: "#fdf8f3",
              padding: "0.9rem 2.5rem",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "0.65rem",
              fontWeight: 500,
              transition: "background 0.25s",
            }}>
              {p.ctaPrimaryText} <span style={{ fontSize: "0.95rem" }}>→</span>
            </Link>
            {isExternalSecondary ? (
              <a href={p.ctaSecondaryUrl} target="_blank" rel="noopener noreferrer" style={{
                border: "1px solid rgba(42,18,21,0.3)",
                color: "#2a1215",
                padding: "0.9rem 2.5rem",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center",
                fontWeight: 500,
                transition: "border-color 0.25s",
              }}>
                {p.ctaSecondaryText}
              </a>
            ) : (
              <Link href={p.ctaSecondaryUrl} style={{
                border: "1px solid rgba(42,18,21,0.3)",
                color: "#2a1215",
                padding: "0.9rem 2.5rem",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center",
                fontWeight: 500,
                transition: "border-color 0.25s",
              }}>
                {p.ctaSecondaryText}
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT ── Decorative circular panel */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          animation: "slideUp 0.85s ease 0.35s both",
        }}>

          {/* Soft ambient glow behind ring */}
          <div style={{
            position: "absolute",
            width: "clamp(280px, 40vw, 500px)",
            height: "clamp(280px, 40vw, 500px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,133,106,0.14) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />

          {/* Outer ring */}
          <div style={{
            width: "clamp(240px, 34vw, 440px)",
            height: "clamp(240px, 34vw, 440px)",
            borderRadius: "50%",
            border: "1px solid rgba(180,110,90,0.28)",
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "float 9s ease-in-out infinite",
            flexShrink: 0,
          }}>

            {/* Inner ring */}
            <div style={{
              position: "absolute",
              inset: "18px",
              borderRadius: "50%",
              border: "1px solid rgba(180,110,90,0.14)",
            }} />

            {/* Second inner ring */}
            <div style={{
              position: "absolute",
              inset: "40px",
              borderRadius: "50%",
              border: "1px dashed rgba(180,110,90,0.1)",
            }} />

            {/* Lotus / 8-petal SVG ornament */}
            <svg
              viewBox="0 0 220 220"
              style={{
                width: "clamp(110px, 16vw, 200px)",
                height: "clamp(110px, 16vw, 200px)",
                opacity: 0.22,
                flexShrink: 0,
              }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <ellipse
                  key={deg}
                  cx="110" cy="110" rx="16" ry="52"
                  fill="rgba(180,110,90,0.25)"
                  stroke="rgba(180,110,90,0.9)"
                  strokeWidth="1"
                  transform={`rotate(${deg}, 110, 110)`}
                />
              ))}
              <circle cx="110" cy="110" r="14" fill="none" stroke="rgba(180,110,90,0.9)" strokeWidth="1" />
              <circle cx="110" cy="110" r="7" fill="rgba(180,110,90,0.55)" />
            </svg>

            {/* Compass-point accent dots on the outer ring */}
            {[
              { top: "-5px", left: "50%", transform: "translateX(-50%)" },
              { bottom: "-5px", left: "50%", transform: "translateX(-50%)" },
              { left: "-5px", top: "50%", transform: "translateY(-50%)" },
              { right: "-5px", top: "50%", transform: "translateY(-50%)" },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", ...pos,
                width: "9px", height: "9px", borderRadius: "50%",
                background: "rgba(180,110,90,0.45)",
              }} />
            ))}
          </div>

          {/* Floating stat badge — top right */}
          <div style={{
            position: "absolute", top: "8%", right: "-2%",
            background: "rgba(253,248,243,0.97)",
            border: "1px solid rgba(180,110,90,0.22)",
            borderRadius: "14px",
            padding: "0.65rem 1rem",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(42,18,21,0.07)",
            textAlign: "center",
            animation: "float 6s ease-in-out infinite",
            animationDelay: "-2s",
          }}>
            <p style={{
              fontSize: "1.25rem", fontWeight: 700,
              color: "#2a1215", margin: 0,
              fontFamily: "var(--font-playfair)",
              lineHeight: 1.1,
            }}>500+</p>
            <p style={{
              fontSize: "0.58rem", letterSpacing: "0.2em",
              color: "#9a6a6a", margin: 0,
              textTransform: "uppercase", fontWeight: 500,
            }}>Designs</p>
          </div>

          {/* Floating stat badge — bottom left */}
          <div style={{
            position: "absolute", bottom: "10%", left: "-6%",
            background: "rgba(253,248,243,0.97)",
            border: "1px solid rgba(180,110,90,0.22)",
            borderRadius: "14px",
            padding: "0.65rem 1rem",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(42,18,21,0.07)",
            textAlign: "center",
            animation: "float 7s ease-in-out infinite",
            animationDelay: "-4s",
          }}>
            <p style={{
              fontSize: "1.25rem", fontWeight: 700,
              color: "#2a1215", margin: 0,
              fontFamily: "var(--font-playfair)",
              lineHeight: 1.1,
            }}>★ 4.9</p>
            <p style={{
              fontSize: "0.58rem", letterSpacing: "0.2em",
              color: "#9a6a6a", margin: 0,
              textTransform: "uppercase", fontWeight: 500,
            }}>Rated</p>
          </div>
        </div>
      </div>

      {/* ── Bottom accent strip ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(180,110,90,0.35) 25%, rgba(180,110,90,0.35) 75%, transparent)",
      }} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT — renders the selected layout
   ═══════════════════════════════════════════════════════════════════ */
export default function HeroSection(props: HeroProps) {
  switch (props.layout) {
    case "split":    return <SplitHero {...props} />;
    case "minimal":  return <MinimalHero {...props} />;
    case "diagonal": return <DiagonalHero {...props} />;
    case "framed":   return <FramedHero {...props} />;
    case "luxury":   return <LuxuryHero {...props} />;
    case "blossom":  return <BlossomHero {...props} />;
    case "celestial":
    default:         return <CelestialHero {...props} />;
  }
}
