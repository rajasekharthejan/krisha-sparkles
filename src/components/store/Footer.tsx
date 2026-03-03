"use client";

import Link from "next/link";
import { Instagram, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--gold-border)",
        paddingTop: "4rem",
        paddingBottom: "2rem",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.75rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.5rem",
              }}
            >
              Krisha Sparkles
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.8, maxWidth: "280px" }}>
              Exquisite imitation jewelry & ethnic wear. Where tradition meets elegance — crafted for the modern Indian woman in America.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <a
                href="https://www.instagram.com/krisha_sparkles/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1px solid var(--gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--gold)";
                  e.currentTarget.style.color = "#0a0a0a";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(201,168,76,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--gold)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              Shop
            </h4>
            {[
              { label: "All Jewelry", href: "/shop" },
              { label: "Necklaces", href: "/shop?category=necklaces" },
              { label: "Earrings", href: "/shop?category=earrings" },
              { label: "Jadau Jewelry", href: "/shop?category=jadau-jewelry" },
              { label: "Pendant Sets", href: "/shop?category=pendant-sets" },
              { label: "Dresses", href: "/shop?category=dresses" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  color: "var(--muted)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  marginBottom: "0.6rem",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Info */}
          <div>
            <h4
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              Info
            </h4>
            {[
              { label: "FAQ", href: "/faq" },
              { label: "Contact Us", href: "/contact" },
              { label: "Support", href: "/support" },
              { label: "Shipping Policy", href: "/support#shipping" },
              { label: "Privacy Policy", href: "/privacy-policy" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  color: "var(--muted)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  marginBottom: "0.6rem",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              Contact
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Mail size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  hello@shopkrisha.com
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Instagram size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <a
                  href="https://www.instagram.com/krisha_sparkles/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none" }}
                >
                  
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <MapPin size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Texas, USA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", paddingTop: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--subtle)" }}>
              © {new Date().getFullYear()} Krisha Sparkles LLC. All rights reserved.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--subtle)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              Made with <Heart size={12} style={{ color: "var(--gold)", fill: "var(--gold)" }} /> for the love of jewelry
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
