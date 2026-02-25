import type { Metadata } from "next";
import { Instagram, Mail, MessageCircle, Clock, Package, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Support — Krisha Sparkles",
  description: "Get help with your Krisha Sparkles order. Contact us via email or Instagram.",
};

const FAQ = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 5–8 business days within the USA. Expedited options are available at checkout.",
  },
  {
    q: "Can I return or exchange an item?",
    a: "Yes! We accept returns within 14 days of delivery for unused items in original packaging. Contact us to initiate a return.",
  },
  {
    q: "My order hasn't arrived — what do I do?",
    a: "Check your tracking link from your confirmation email. If it's been over 10 business days, email us and we'll investigate immediately.",
  },
  {
    q: "Are the jewelry pieces real gold or silver?",
    a: "Krisha Sparkles sells high-quality imitation jewelry. Our pieces are gold-plated or silver-plated, not solid gold or silver.",
  },
  {
    q: "How do I care for my jewelry?",
    a: "Keep away from water, perfume, and sweat. Store in the pouch provided. Wipe with a soft dry cloth after use.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Contact us within 1 hour of placing your order. After that, orders may already be packed and we cannot guarantee changes.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship within the USA only. International shipping is coming soon — follow us on Instagram for updates.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. All payments are processed by Stripe, which is PCI-DSS Level 1 certified. We never store your card details.",
  },
];

export default function SupportPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingTop: "80px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: 700,
            background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.75rem",
          }}>
            How Can We Help?
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            We typically respond within 24 hours. Reach us through any of the options below.
          </p>
        </div>

        {/* Contact Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "3.5rem" }}>
          <ContactCard
            icon={<Mail size={22} />}
            title="Email Us"
            detail="support@krishasparkles.com"
            sub="Response within 24 hours"
            href="mailto:support@krishasparkles.com"
          />
          <ContactCard
            icon={<Instagram size={22} />}
            title="Instagram DM"
            detail="@krisha.sparkles"
            sub="Fastest response"
            href="https://www.instagram.com/krisha.sparkles/"
          />
          <ContactCard
            icon={<Clock size={22} />}
            title="Support Hours"
            detail="Mon – Sat"
            sub="9 AM – 7 PM EST"
            href={undefined}
          />
        </div>

        {/* Quick Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "3.5rem" }}>
          <QuickLink icon={<Package size={16} />} label="Track My Order" href="mailto:support@krishasparkles.com?subject=Order%20Tracking" />
          <QuickLink icon={<RotateCcw size={16} />} label="Start a Return" href="mailto:support@krishasparkles.com?subject=Return%20Request" />
          <QuickLink icon={<MessageCircle size={16} />} label="Order Question" href="mailto:support@krishasparkles.com?subject=Order%20Question" />
        </div>

        {/* FAQ */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "1.5rem",
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {FAQ.map((item, i) => (
              <details
                key={i}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <summary style={{
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}>
                  {item.q}
                  <span style={{ color: "var(--gold)", flexShrink: 0, fontSize: "1.2rem" }}>+</span>
                </summary>
                <div style={{
                  padding: "0 1.25rem 1rem",
                  color: "var(--muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  borderTop: "1px solid var(--gold-border)",
                  paddingTop: "0.75rem",
                }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function ContactCard({
  icon, title, detail, sub, href,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  sub: string;
  href?: string;
}) {
  const content = (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--gold-border)",
      borderRadius: "12px",
      padding: "1.5rem",
      textAlign: "center",
      transition: "border-color 0.2s",
      cursor: href ? "pointer" : "default",
      textDecoration: "none",
    }}>
      <div style={{ color: "var(--gold)", display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
        {icon}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{title}</div>
      <div style={{ color: "var(--text)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{detail}</div>
      <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{sub}</div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {content}
      </a>
    );
  }
  return content;
}

function QuickLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.875rem 1.25rem",
        background: "rgba(201,168,76,0.06)",
        border: "1px solid var(--gold-border)",
        borderRadius: "8px",
        color: "var(--gold)",
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "background 0.2s",
      }}
    >
      {icon}
      {label}
    </a>
  );
}
