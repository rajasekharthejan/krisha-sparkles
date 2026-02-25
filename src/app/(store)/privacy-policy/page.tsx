import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Krisha Sparkles",
  description: "Privacy Policy for Krisha Sparkles jewelry and fashion store.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingTop: "80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: 700,
            background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.5rem",
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Last updated: February 25, 2026
          </p>
        </div>

        <div style={{ color: "var(--muted)", lineHeight: 1.85, fontSize: "0.95rem" }}>

          <Section title="1. Introduction">
            Krisha Sparkles LLC ("we," "our," or "us") operates the Krisha Sparkles website and
            mobile application (collectively, the "Service"). This Privacy Policy explains how we
            collect, use, and protect your personal information when you use our Service.
          </Section>

          <Section title="2. Information We Collect">
            <strong style={{ color: "var(--text)" }}>Information you provide directly:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              <li>Name, email address, and shipping address when placing an order</li>
              <li>Payment information (processed securely by Stripe — we never store card details)</li>
              <li>Email address if you subscribe to our newsletter</li>
              <li>Messages you send to our support team</li>
            </ul>
            <br />
            <strong style={{ color: "var(--text)" }}>Information collected automatically:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              <li>Device type, operating system, and browser type</li>
              <li>IP address and general location (country/region)</li>
              <li>Pages visited, time spent, and interactions within the app</li>
              <li>Shopping cart contents (stored locally on your device)</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            We use your information to:
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping notifications</li>
              <li>Respond to your questions and support requests</li>
              <li>Send promotional emails (only if you opt in)</li>
              <li>Improve our products and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Sharing Your Information">
            We do not sell your personal information. We share data only with:
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              <li><strong style={{ color: "var(--text)" }}>Stripe</strong> — for secure payment processing</li>
              <li><strong style={{ color: "var(--text)" }}>Shipping carriers</strong> — to deliver your orders</li>
              <li><strong style={{ color: "var(--text)" }}>Supabase</strong> — our secure database provider</li>
              <li><strong style={{ color: "var(--text)" }}>Law enforcement</strong> — when required by law</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            We retain your order information for 7 years for tax and accounting purposes. You may
            request deletion of your account data by contacting us — we will delete all personal
            data not required for legal compliance within 30 days.
          </Section>

          <Section title="6. Cookies & Tracking">
            We use essential cookies to keep your shopping cart active and maintain your session.
            We do not use third-party advertising or tracking cookies. You can clear cookies at
            any time through your browser or device settings.
          </Section>

          <Section title="7. Your Rights">
            Depending on your location, you may have the right to:
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing emails at any time (unsubscribe link in every email)</li>
            </ul>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@krishasparkles.com" style={{ color: "var(--gold)" }}>
              privacy@krishasparkles.com
            </a>
          </Section>

          <Section title="8. Security">
            We use industry-standard encryption (TLS/HTTPS) for all data in transit. Payments are
            handled exclusively by Stripe, which is PCI-DSS Level 1 certified. We never store
            credit card numbers on our servers.
          </Section>

          <Section title="9. Children's Privacy">
            Our Service is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with
            personal information, please contact us and we will delete it promptly.
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by posting the new policy on this page with an updated date. Continued use of
            the Service after changes constitutes acceptance of the updated policy.
          </Section>

          <Section title="11. Contact Us">
            If you have any questions about this Privacy Policy, please contact us:
            <div style={{ marginTop: "0.75rem", padding: "1rem 1.25rem", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--gold-border)" }}>
              <strong style={{ color: "var(--text)" }}>Krisha Sparkles LLC</strong><br />
              Email:{" "}
              <a href="mailto:privacy@krishasparkles.com" style={{ color: "var(--gold)" }}>
                privacy@krishasparkles.com
              </a><br />
              Website:{" "}
              <a href="https://krisha-sparkles.vercel.app" style={{ color: "var(--gold)" }}>
                krisha-sparkles.vercel.app
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{
        fontFamily: "var(--font-playfair)",
        fontSize: "1.1rem",
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: "0.6rem",
      }}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
