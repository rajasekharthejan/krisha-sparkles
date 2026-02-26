import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Find answers about shipping, returns, payment, product care, and more at Krisha Sparkles.",
  openGraph: {
    title: "FAQ | Krisha Sparkles",
    description: "Everything you need to know about Krisha Sparkles jewelry, shipping, returns, and payments.",
  },
};

const FAQ_SECTIONS = [
  {
    title: "🚚 Shipping",
    items: [
      { q: "How long does delivery take?", a: "Standard shipping takes 5–8 business days within the USA. Express shipping (2–4 business days) is available at checkout for $9.99." },
      { q: "Do you offer free shipping?", a: "Yes! Orders over $75 qualify for free standard shipping automatically — no coupon needed." },
      { q: "Do you ship internationally?", a: "Currently we ship within the USA only. We're working on international shipping and will announce when it's available." },
      { q: "How do I track my order?", a: "Once your order ships, you'll receive a tracking number via email. You can also view tracking details in your account under Order History." },
      { q: "Can I change my shipping address after ordering?", a: "Contact us at support@krishasparkles.com within 2 hours of placing your order. After that, the order may already be processing and we cannot guarantee changes." },
    ],
  },
  {
    title: "↩️ Returns & Refunds",
    items: [
      { q: "What is your return policy?", a: "We accept returns within 14 days of delivery for unworn, undamaged items in original packaging. Sale items and custom orders are final sale." },
      { q: "How do I start a return?", a: "Email support@krishasparkles.com with your order number and reason for return. We'll send you a prepaid return label within 1 business day." },
      { q: "When will I receive my refund?", a: "Once we receive and inspect the returned item, refunds are processed within 3–5 business days to your original payment method." },
      { q: "What if my item arrived damaged?", a: "We're so sorry! Please email us within 48 hours of delivery with photos of the damage. We'll send a replacement or full refund at no cost to you." },
      { q: "Can I exchange instead of returning?", a: "Yes! Mention in your return request that you'd like an exchange, and we'll reserve the replacement item for you." },
    ],
  },
  {
    title: "💎 Products",
    items: [
      { q: "What materials are your jewelry pieces made of?", a: "Our imitation jewelry is crafted with high-quality brass or zinc alloy bases with gold plating (14K–18K equivalent finish), cubic zirconia stones, and synthetic gemstones. They are not solid gold or silver." },
      { q: "How do I care for my jewelry?", a: "Keep jewelry dry — remove before swimming, showering, or exercising. Store in the included pouch away from direct sunlight. Wipe gently with a soft cloth after wearing." },
      { q: "Will the gold plating fade?", a: "With proper care, our jewelry maintains its finish for 1–2 years with regular wear. Avoid contact with perfumes, lotions, and harsh chemicals." },
      { q: "Are your pieces nickel-free?", a: "Most of our collection is nickel-free and hypoallergenic. If you have specific metal sensitivities, please contact us before purchasing and we'll check the specific piece for you." },
      { q: "Do you offer customization?", a: "Currently we don't offer customization, but we're working on it! Follow us on Instagram @krisha.sparkles for announcements." },
    ],
  },
  {
    title: "💳 Payments",
    items: [
      { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards (Visa, Mastercard, Amex, Discover), Apple Pay, Google Pay, and other methods via Stripe." },
      { q: "Is my payment information secure?", a: "Absolutely. All payments are processed by Stripe, which is PCI DSS Level 1 certified — the highest security standard for payment processing. We never store your card details." },
      { q: "Can I apply a coupon code?", a: "Yes! Enter your coupon code on the checkout page before completing your purchase. Only one coupon can be applied per order." },
      { q: "Why was my payment declined?", a: "Common reasons include incorrect card details, insufficient funds, or bank security flags on new online merchants. Try again or contact your bank. You can also reach us at support@krishasparkles.com." },
    ],
  },
  {
    title: "👤 Account & Orders",
    items: [
      { q: "Do I need an account to order?", a: "No, guest checkout is fully supported. However, creating an account lets you track orders, save your wishlist, and speed up future checkouts." },
      { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page. We'll email you a secure reset link valid for 1 hour." },
      { q: "Can I cancel my order?", a: "Contact us at support@krishasparkles.com within 2 hours of placing your order. After that, the order may have already shipped." },
      { q: "I didn't receive an order confirmation email.", a: "Check your spam/junk folder first. If it's not there, email support@krishasparkles.com with your name and the email you used at checkout." },
      { q: "How do I leave a product review?", a: "Visit the product page after receiving your order and scroll to the Reviews section. You must be logged in to submit a review." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)", borderBottom: "1px solid var(--gold-border)", padding: "4rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <span className="badge-gold" style={{ marginBottom: "1rem", display: "inline-block" }}>FAQ</span>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, margin: "0 0 1rem" }}>
            Frequently Asked{" "}
            <span style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Questions
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
            Everything you need to know about Krisha Sparkles jewelry, shipping, and more.
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Can&apos;t find your answer?{" "}
            <Link href="/contact" style={{ color: "var(--gold)", textDecoration: "none" }}>Contact us</Link>
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.35rem", fontWeight: 700, color: "var(--gold)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--gold-border)" }}>
              {section.title}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {section.items.map((item) => (
                <details
                  key={item.q}
                  style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", overflow: "hidden" }}
                >
                  <summary style={{ padding: "1.1rem 1.25rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", userSelect: "none" }}>
                    {item.q}
                    <ChevronDown size={16} style={{ color: "var(--gold)", flexShrink: 0, transition: "transform 0.2s" }} />
                  </summary>
                  <p style={{ padding: "0 1.25rem 1.25rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2.5rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Still have questions?
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>Our team usually responds within a few hours.</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn-gold">Send us a Message</Link>
            <a href="mailto:support@krishasparkles.com" className="btn-gold-outline" style={{ display: "inline-flex", alignItems: "center" }}>
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
