"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Package, MapPin, User, Mail, Truck, MessageCircle,
  ExternalLink, Copy, CheckCheck, Loader2, Tag, Scale, ChevronDown, X, Printer
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order } from "@/types";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

const statusStyle = (status: string) => {
  const map: Record<string, { color: string; bg: string }> = {
    pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    paid:      { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    shipped:   { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    delivered: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };
  return map[status] || { color: "var(--muted)", bg: "rgba(255,255,255,0.05)" };
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ color: "var(--gold)" }}>{icon}</span>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "0.9rem", color: value ? "var(--text)" : "var(--muted)", fontStyle: value ? "normal" : "italic" }}>{value || "—"}</p>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Label modal state
  const [labelOpen, setLabelOpen] = useState(false);
  const [weightOz, setWeightOz] = useState("8");
  const [labelLength, setLabelLength] = useState("10");
  const [labelWidth, setLabelWidth] = useState("7");
  const [labelHeight, setLabelHeight] = useState("2");
  const [labelService, setLabelService] = useState("Priority");
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelResult, setLabelResult] = useState<{ label_url: string; tracking_number: string; tracking_url: string; rate: string; service: string } | null>(null);
  const [labelError, setLabelError] = useState("");

  // WhatsApp modal state
  const [waOpen, setWaOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("");

  // Email notification state
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdatingStatus(true);
    await fetch("/api/admin/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, status: newStatus }),
    });
    setOrder((o) => o ? { ...o, status: newStatus as Order["status"] } : o);
    setUpdatingStatus(false);
  }

  async function sendShippingEmail() {
    if (!order) return;
    setEmailSending(true);
    await fetch("/api/admin/orders/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, type: "shipping_update" }),
    });
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  async function openWhatsApp() {
    if (!order || !waPhone) return;
    const res = await fetch("/api/admin/orders/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, type: "whatsapp", custom_message: waPhone }),
    });
    const data = await res.json();
    if (data.whatsapp_url) window.open(data.whatsapp_url, "_blank");
    setWaOpen(false);
  }

  async function generateLabel() {
    if (!order) return;
    setLabelLoading(true);
    setLabelError("");
    setLabelResult(null);
    const res = await fetch("/api/admin/orders/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: order.id,
        weight_oz: parseFloat(weightOz),
        length: parseFloat(labelLength),
        width: parseFloat(labelWidth),
        height: parseFloat(labelHeight),
        service: labelService,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setLabelResult(data);
      setOrder((o) => o ? { ...o, tracking_number: data.tracking_number, tracking_url: data.tracking_url, status: "shipped" } : o);
    } else {
      setLabelError(data.error || "Failed to generate label");
    }
    setLabelLoading(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--gold)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Order not found.</p>
        <button onClick={() => router.push("/admin/orders")} className="btn-gold" style={{ marginTop: "1rem" }}>Back to Orders</button>
      </div>
    );
  }

  const badge = statusStyle(order.status);
  const addr = order.shipping_address;
  const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => router.push("/admin/orders")} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", color: "var(--muted)", display: "flex", transition: "all 0.2s" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, color: badge.color, background: badge.bg, textTransform: "capitalize" }}>
                {order.status}
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{formatDate(order.created_at)} · {itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setWaOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button onClick={sendShippingEmail} disabled={emailSending} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "var(--gold)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}>
            {emailSent ? <><CheckCheck size={15} /> Sent!</> : emailSending ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : <><Mail size={15} /> Email Customer</>}
          </button>
          <button onClick={() => setLabelOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s" }}>
            <Printer size={15} /> Generate USPS Label
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Customer */}
          <Section title="Customer" icon={<User size={15} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Full Name" value={order.name} />
              <Field label="Email" value={order.email} />
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <a href={`mailto:${order.email}`} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.85rem", borderRadius: "6px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--gold)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>
                <Mail size={12} /> Send Email
              </a>
              <button onClick={() => copy(order.email)} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.85rem", borderRadius: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer" }}>
                {copied ? <CheckCheck size={12} /> : <Copy size={12} />} Copy Email
              </button>
            </div>
          </Section>

          {/* Shipping Address */}
          <Section title="Shipping Address" icon={<MapPin size={15} />}>
            {addr ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="Street" value={`${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}`} />
                  <Field label="City" value={addr.city} />
                  <Field label="State" value={addr.state} />
                  <Field label="ZIP" value={addr.postal_code} />
                  <Field label="Country" value={addr.country} />
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${addr.line1} ${addr.city} ${addr.state} ${addr.postal_code}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: "1rem", padding: "0.4rem 0.85rem", borderRadius: "6px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--gold)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
                >
                  <ExternalLink size={12} /> View on Maps
                </a>
              </>
            ) : (
              <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.875rem" }}>No shipping address on file</p>
            )}
          </Section>

          {/* Tracking */}
          <Section title="Tracking" icon={<Truck size={15} />}>
            {order.tracking_number ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "#3b82f6", fontWeight: 600 }}>{order.tracking_number}</span>
                  <button onClick={() => copy(order.tracking_number!)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                    {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.85rem", borderRadius: "6px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>
                    <ExternalLink size={12} /> Track Package
                  </a>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.875rem" }}>No tracking yet — generate a USPS label or add tracking manually</p>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Order Summary */}
          <Section title="Order Summary" icon={<Package size={15} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              {(order.order_items || []).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--elevated)", borderRadius: "8px" }}>
                  {item.product_image ? (
                    <Image src={item.product_image} alt={item.product_name} width={48} height={48} style={{ borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "6px", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={20} style={{ color: "var(--gold)", opacity: 0.5 }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product_name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.15rem 0 0" }}>Qty: {item.quantity} · {formatPrice(item.price)} each</p>
                  </div>
                  <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--muted)" }}>
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--muted)" }}>
                <span>Tax</span><span>{formatPrice(order.tax)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, color: "var(--gold)", marginTop: "0.25rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Section>

          {/* Update Status */}
          <Section title="Update Status" icon={<Tag size={15} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {STATUSES.map((s) => {
                const st = statusStyle(s);
                const active = order.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => !active && updateStatus(s)}
                    disabled={updatingStatus || active}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.6rem 1rem", borderRadius: "8px", cursor: active ? "default" : "pointer",
                      background: active ? st.bg : "transparent",
                      border: `1px solid ${active ? st.color + "40" : "rgba(255,255,255,0.06)"}`,
                      color: active ? st.color : "var(--muted)",
                      fontSize: "0.825rem", fontWeight: active ? 700 : 400,
                      textTransform: "capitalize", transition: "all 0.2s",
                      opacity: updatingStatus && !active ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = st.color + "40"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <span>{s}</span>
                    {active && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: st.color + "20" }}>CURRENT</span>}
                    {updatingStatus && !active && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Notes */}
          {order.notes && (
            <Section title="Customer Notes" icon={<Tag size={15} />}>
              <p style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{order.notes}</p>
            </Section>
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      {waOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) setWaOpen(false); }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MessageCircle size={18} style={{ color: "#25d366" }} /> WhatsApp Customer
              </h2>
              <button onClick={() => setWaOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>Customer Phone Number</label>
                <input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="+1 555 000 0000" className="input-dark" style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>Opens WhatsApp Web with a pre-filled order status message for order #{order.id.slice(-8).toUpperCase()}.</p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setWaOpen(false)} className="btn-gold-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={openWhatsApp} disabled={!waPhone} className="btn-gold" style={{ flex: 1, justifyContent: "center", background: "#25d366", borderColor: "#25d366", color: "#000" }}>
                  <MessageCircle size={14} /> Open WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USPS Label Modal */}
      {labelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) { setLabelOpen(false); setLabelResult(null); setLabelError(""); } }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Printer size={18} style={{ color: "#3b82f6" }} /> Generate USPS Label
              </h2>
              <button onClick={() => { setLabelOpen(false); setLabelResult(null); setLabelError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><X size={18} /></button>
            </div>

            {labelResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
                  <p style={{ color: "#10b981", fontWeight: 700, margin: "0 0 0.5rem" }}>✅ Label Generated!</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.25rem" }}>Tracking: <span style={{ color: "#3b82f6", fontFamily: "monospace" }}>{labelResult.tracking_number}</span></p>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>{labelResult.service} · ${labelResult.rate}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <a href={labelResult.label_url} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
                    <Printer size={14} /> Print Label
                  </a>
                  <a href={labelResult.tracking_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.5rem", borderRadius: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                    <Truck size={14} /> Track
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>Service</label>
                  <div style={{ position: "relative" }}>
                    <select value={labelService} onChange={(e) => setLabelService(e.target.value)} style={{ width: "100%", padding: "0.65rem 2rem 0.65rem 0.75rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", appearance: "none", cursor: "pointer", outline: "none" }}>
                      <option value="FirstClass">USPS First Class</option>
                      <option value="Priority">USPS Priority Mail</option>
                      <option value="ParcelSelect">USPS Parcel Select</option>
                      <option value="Express">USPS Priority Mail Express</option>
                    </select>
                    <ChevronDown size={13} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>Weight (ounces)</label>
                  <div style={{ position: "relative" }}>
                    <Scale size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                    <input type="number" value={weightOz} onChange={(e) => setWeightOz(e.target.value)} min="1" step="0.5" className="input-dark" style={{ paddingLeft: "2rem", width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>Dimensions (inches): L × W × H</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <input type="number" value={labelLength} onChange={(e) => setLabelLength(e.target.value)} placeholder="L" className="input-dark" />
                    <input type="number" value={labelWidth} onChange={(e) => setLabelWidth(e.target.value)} placeholder="W" className="input-dark" />
                    <input type="number" value={labelHeight} onChange={(e) => setLabelHeight(e.target.value)} placeholder="H" className="input-dark" />
                  </div>
                </div>
                {labelError && (
                  <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#ef4444", fontSize: "0.8rem" }}>
                    {labelError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => { setLabelOpen(false); setLabelError(""); }} className="btn-gold-outline" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={generateLabel} disabled={labelLoading} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                    {labelLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : <><Printer size={14} /> Generate & Buy</>}
                  </button>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0, textAlign: "center" }}>Requires EASYPOST_API_KEY in Vercel env vars</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
