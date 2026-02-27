"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Send, CheckCircle, Loader2 } from "lucide-react";

const SUBJECTS = [
  { value: "order_issue", label: "Order Issue" },
  { value: "return_request", label: "Return / Refund Request" },
  { value: "product_question", label: "Product Question" },
  { value: "general", label: "General Inquiry" },
  { value: "other", label: "Other" },
];

export default function ContactPageClient() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    background: "var(--elevated)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--muted)",
    display: "block",
    marginBottom: "0.5rem",
  };

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)", borderBottom: "1px solid var(--gold-border)", padding: "4rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <span className="badge-gold" style={{ marginBottom: "1rem", display: "inline-block" }}>Contact Us</span>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, margin: "0 0 1rem" }}>
            We&apos;d Love to{" "}
            <span style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Hear From You
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
            Have a question about your order, a product, or just want to say hi? We typically respond within a few hours.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem" }}>

        {/* Contact Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>Get in Touch</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>
              Our team is here Monday–Friday, 9 AM – 6 PM CST. We&apos;ll do our best to respond as quickly as possible.
            </p>
          </div>

          {[
            {
              icon: <Mail size={18} />,
              label: "Email",
              value: "hello@shopkrisha.com",
              href: "mailto:hello@shopkrisha.com",
            },
            {
              icon: <Instagram size={18} />,
              label: "Instagram",
              value: "@krisha.sparkles",
              href: "https://www.instagram.com/krisha.sparkles/",
              external: true,
            },
            {
              icon: <MapPin size={18} />,
              label: "Location",
              value: "Texas, USA",
              href: null,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: "1rem",
                padding: "1.25rem",
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                borderRadius: "12px",
                alignItems: "flex-start",
              }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 0.25rem" }}>{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    {item.value}
                  </a>
                ) : (
                  <p style={{ color: "var(--text)", fontSize: "0.9rem", fontWeight: 500, margin: 0 }}>{item.value}</p>
                )}
              </div>
            </div>
          ))}

          {/* Quick links */}
          <div style={{ padding: "1.25rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.75rem" }}>Quick Answers</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link href="/faq" style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.875rem" }}>→ Browse our FAQ</Link>
              <Link href="/support" style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.875rem" }}>→ Shipping & Returns Policy</Link>
              <Link href="/account/orders" style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.875rem" }}>→ Track your order</Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          {success ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "3rem", textAlign: "center", animation: "scaleIn 0.4s ease" }}>
              <CheckCircle size={56} style={{ color: "#10b981", margin: "0 auto 1.25rem" }} />
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Message Sent!</h3>
              <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                Thank you for reaching out. We&apos;ve received your message and will reply to <strong style={{ color: "var(--text)" }}>{form.email}</strong> within a few hours.
              </p>
              <button
                onClick={() => { setSuccess(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="btn-gold-outline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "2rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.75rem", color: "var(--gold)" }}>
                Send Us a Message
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      style={inputStyle}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                      style={inputStyle}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Subject *</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    className="input-dark"
                  >
                    <option value="">Select a topic...</option>
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us how we can help you..."
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical" }}
                    className="input-dark"
                  />
                  <p style={{ fontSize: "0.72rem", color: "var(--subtle)", marginTop: "0.35rem" }}>
                    {form.message.length}/500 characters
                  </p>
                </div>

                {error && (
                  <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold"
                  style={{ justifyContent: "center", padding: "0.9rem" }}
                >
                  {loading ? (
                    <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>

                <p style={{ fontSize: "0.75rem", color: "var(--subtle)", textAlign: "center" }}>
                  By submitting, you agree to our{" "}
                  <Link href="/privacy-policy" style={{ color: "var(--gold)", textDecoration: "none" }}>Privacy Policy</Link>.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
