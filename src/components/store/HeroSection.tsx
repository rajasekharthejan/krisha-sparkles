"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

export interface HeroProps {
  layout: "celestial" | "split" | "minimal" | "diagonal" | "framed";
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
   MAIN EXPORT — renders the selected layout
   ═══════════════════════════════════════════════════════════════════ */
export default function HeroSection(props: HeroProps) {
  switch (props.layout) {
    case "split":    return <SplitHero {...props} />;
    case "minimal":  return <MinimalHero {...props} />;
    case "diagonal": return <DiagonalHero {...props} />;
    case "framed":   return <FramedHero {...props} />;
    case "celestial":
    default:         return <CelestialHero {...props} />;
  }
}
