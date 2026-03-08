import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, MapPin, CreditCard, Truck, ExternalLink, CheckCircle2, Circle, Clock, MapPinned, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", paid: "#10b981",
  shipped: "#3b82f6", label_created: "#3b82f6",
  in_transit: "#6366f1", out_for_delivery: "#f59e0b",
  delivered: "#22c55e", cancelled: "#ef4444", returned: "#ef4444",
};
const STATUS_BG: Record<string, string> = {
  pending: "rgba(245,158,11,0.1)", paid: "rgba(16,185,129,0.1)",
  shipped: "rgba(59,130,246,0.1)", label_created: "rgba(59,130,246,0.1)",
  in_transit: "rgba(99,102,241,0.1)", out_for_delivery: "rgba(245,158,11,0.1)",
  delivered: "rgba(34,197,94,0.1)", cancelled: "rgba(239,68,68,0.1)", returned: "rgba(239,68,68,0.1)",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", paid: "Paid", shipped: "Label Created",
  label_created: "Label Created", in_transit: "In Transit",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  cancelled: "Cancelled", returned: "Returned",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id, product_name, product_image, quantity, price, product_id, products(slug))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const addr = order.shipping_address as {
    line1?: string; line2?: string; city?: string;
    state?: string; postal_code?: string; country?: string;
  } | null;

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/account/orders" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "2rem" }}>
          <ArrowLeft size={15} /> Back to Orders
        </Link>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.6rem", fontWeight: 700, margin: "0 0 0.25rem" }}>
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
              Placed on {new Date(order.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <span style={{
            padding: "0.4rem 1rem", borderRadius: "9999px",
            fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize",
            background: STATUS_BG[order.status] || "rgba(100,100,100,0.1)",
            color: STATUS_COLOR[order.status] || "var(--muted)",
          }}>
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>

        {/* Items */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--gold-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={16} style={{ color: "var(--gold)" }} />
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", margin: 0 }}>Items</h3>
          </div>
          {order.order_items?.map((item: {
            id: string; product_name: string; product_image?: string;
            quantity: number; price: number; product_id?: string;
            products?: { slug: string } | null;
          }) => {
            const slug = item.products?.slug;
            const ItemWrapper = slug ? Link : "div";
            const wrapperProps = slug
              ? { href: `/shop/${slug}`, style: { display: "flex", gap: "1rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", textDecoration: "none", color: "inherit", transition: "background 0.15s" }, onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }, onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "transparent"; } }
              : { style: { display: "flex", gap: "1rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" } };
            return (
              // @ts-expect-error dynamic tag
              <ItemWrapper key={item.id} {...wrapperProps}>
                <div style={{ width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  {item.product_image ? (
                    <Image src={item.product_image} alt={item.product_name} width={56} height={56} style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>💎</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: "0.9rem", margin: "0 0 2px" }}>{item.product_name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Qty: {item.quantity}</p>
                </div>
                <p style={{ color: "var(--gold)", fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</p>
                {slug && <ChevronRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />}
              </ItemWrapper>
            );
          })}
          {/* Totals */}
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--muted)" }}>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--gold-border)", fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: "var(--gold)", fontFamily: "var(--font-playfair)", fontSize: "1.1rem" }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {/* Shipping Address */}
          {addr && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <MapPin size={16} style={{ color: "var(--gold)" }} />
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", margin: 0 }}>Shipping Address</h3>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {order.name}<br />
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                {addr.city}, {addr.state} {addr.postal_code}<br />
                {addr.country}
              </p>
            </div>
          )}

          {/* Payment */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <CreditCard size={16} style={{ color: "var(--gold)" }} />
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", margin: 0 }}>Payment</h3>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>Paid via Stripe</p>
          </div>
        </div>

        {/* Order Progress Stepper — always shown */}
        {(() => {
          const steps = [
            { key: "pending",          label: "Order Placed",      desc: new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
            { key: "paid",             label: "Payment Confirmed", desc: order.status === "pending" ? "Awaiting payment" : "Paid via Stripe" },
            { key: "label_created",    label: "Label Created",     desc: order.shipped_at ? new Date(order.shipped_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Preparing shipment" },
            { key: "in_transit",       label: "In Transit",        desc: "On the way" },
            { key: "out_for_delivery", label: "Out for Delivery",  desc: "Arriving today!" },
            { key: "delivered",        label: "Delivered",         desc: order.delivered_at ? new Date(order.delivered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Est. 5–8 business days" },
          ];

          // "shipped" maps to label_created in the stepper
          const displayStatus = order.status === "shipped" ? "label_created" : order.status;
          const stepOrder = ["pending", "paid", "label_created", "in_transit", "out_for_delivery", "delivered"];
          const currentIdx = (order.status === "cancelled" || order.status === "returned") ? -1 : stepOrder.indexOf(displayStatus);

          return (
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <Truck size={16} style={{ color: "var(--gold)" }} />
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", margin: 0 }}>Order Progress</h3>
                {(order.status === "cancelled" || order.status === "returned") && (
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    {order.status === "returned" ? "Returned to Sender" : "Cancelled"}
                  </span>
                )}
              </div>

              {/* Steps */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 0, position: "relative" }}>
                {steps.map((step, idx) => {
                  const done    = currentIdx >= idx;
                  const active  = currentIdx === idx;
                  const lineEnd = idx < steps.length - 1;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      {/* Connector line */}
                      {lineEnd && (
                        <div style={{
                          position: "absolute", top: "16px", left: "50%", width: "100%", height: "2px",
                          background: done && currentIdx > idx ? "var(--gold)" : "rgba(255,255,255,0.08)",
                          transition: "background 0.3s",
                          zIndex: 0,
                        }} />
                      )}
                      {/* Icon circle */}
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%", zIndex: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.9rem",
                        background: done ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                        border: `2px solid ${done ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                        transition: "all 0.3s",
                      }}>
                        {done ? (active ? <Clock size={14} style={{ color: "var(--gold)" }} /> : <CheckCircle2 size={14} style={{ color: "var(--gold)" }} />) : <Circle size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
                      </div>
                      {/* Label */}
                      <p style={{ fontSize: "0.7rem", fontWeight: done ? 600 : 400, color: done ? "var(--text)" : "var(--muted)", margin: "0.4rem 0 0.1rem", textAlign: "center", lineHeight: 1.3 }}>
                        {step.label}
                      </p>
                      <p style={{ fontSize: "0.62rem", color: "var(--subtle, rgba(255,255,255,0.3))", margin: 0, textAlign: "center" }}>
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Tracking details — only when shipped */}
              {order.tracking_number && (
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: "0 0 0.2rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tracking Number</p>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", margin: 0, fontFamily: "monospace", letterSpacing: "0.04em" }}>{order.tracking_number}</p>
                  </div>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                    >
                      <ExternalLink size={13} />
                      Track on USPS
                    </a>
                  )}
                </div>
              )}

              {/* Tracking scan history */}
              {Array.isArray(order.tracking_events) && order.tracking_events.length > 0 && (() => {
                type TrackingEvent = { status: string; status_details: string; status_date: string | null; location?: { city?: string; state?: string; country?: string } | null };
                const events: TrackingEvent[] = [...order.tracking_events].reverse();
                const SCAN_ICONS: Record<string, string> = {
                  PRE_TRANSIT: "🏷️", TRANSIT: "🚚", DELIVERED: "✅", RETURNED: "↩️", FAILURE: "⚠️",
                };
                return (
                  <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                      <MapPinned size={14} style={{ color: "var(--gold)" }} />
                      <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Tracking Updates</p>
                    </div>
                    <div style={{ position: "relative", paddingLeft: "1.25rem" }}>
                      {/* Vertical line */}
                      <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "1px", background: "rgba(201,168,76,0.2)" }} />
                      {events.map((ev, i) => {
                        const isLatest = i === 0;
                        const date = ev.status_date ? new Date(ev.status_date) : null;
                        const loc = ev.location;
                        const locStr = loc ? [loc.city, loc.state].filter(Boolean).join(", ") : null;
                        return (
                          <div key={i} style={{ position: "relative", marginBottom: i < events.length - 1 ? "1rem" : 0 }}>
                            {/* Dot */}
                            <div style={{
                              position: "absolute", left: "-1.2rem", top: "3px",
                              width: "10px", height: "10px", borderRadius: "50%",
                              background: isLatest ? "var(--gold)" : "rgba(201,168,76,0.3)",
                              border: isLatest ? "2px solid var(--gold)" : "2px solid rgba(201,168,76,0.4)",
                              boxShadow: isLatest ? "0 0 6px rgba(201,168,76,0.5)" : "none",
                            }} />
                            <div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: isLatest ? 600 : 400, color: isLatest ? "var(--text)" : "var(--muted)" }}>
                                  {SCAN_ICONS[ev.status] || "📦"} {ev.status_details}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.15rem", flexWrap: "wrap" }}>
                                {date && (
                                  <span style={{ fontSize: "0.72rem", color: "var(--subtle, rgba(255,255,255,0.35))" }}>
                                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </span>
                                )}
                                {locStr && (
                                  <span style={{ fontSize: "0.72rem", color: "rgba(201,168,76,0.7)" }}>
                                    📍 {locStr}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link href="/shop" className="btn-gold-outline" style={{ display: "inline-block", fontSize: "0.875rem" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
