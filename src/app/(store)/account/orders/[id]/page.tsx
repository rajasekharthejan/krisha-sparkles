import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, MapPin, CreditCard, Truck, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import RefundRequestButton from "@/components/store/RefundRequestButton";

const STATUS_COLOR: Record<string, string> = {
  paid: "#10b981", shipped: "#3b82f6", delivered: "#22c55e",
  cancelled: "#ef4444", pending: "#f59e0b",
};
const STATUS_BG: Record<string, string> = {
  paid: "rgba(16,185,129,0.1)", shipped: "rgba(59,130,246,0.1)",
  delivered: "rgba(34,197,94,0.1)", cancelled: "rgba(239,68,68,0.1)",
  pending: "rgba(245,158,11,0.1)",
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
    .select("*, order_items(id, product_name, product_image, quantity, price, product_id)")
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
              Order #{order.id.slice(0, 8).toUpperCase()}
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
            {order.status}
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
          }) => (
            <div key={item.id} style={{ display: "flex", gap: "1rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
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
            </div>
          ))}
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
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 0.25rem" }}>Paid via Stripe</p>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0, wordBreak: "break-all" }}>
              Session: {order.stripe_session_id?.slice(0, 24)}...
            </p>
          </div>
        </div>

        {/* Tracking Card */}
        {order.tracking_number && (
          <div style={{ background: "var(--surface)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Truck size={16} style={{ color: "#3b82f6" }} />
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", margin: 0, color: "#3b82f6" }}>Track Package</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 0.25rem" }}>Tracking Number</p>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0, fontFamily: "monospace" }}>{order.tracking_number}</p>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                >
                  <ExternalLink size={14} />
                  Track Package
                </a>
              )}
            </div>
            {order.shipped_at && (
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
                Shipped on {new Date(order.shipped_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        )}

        {/* Refund Button */}
        {(order.status === "paid" || order.status === "shipped" || order.status === "delivered") && (
          <div style={{ marginTop: "1rem" }}>
            <RefundRequestButton orderId={order.id} userEmail={order.email} userId={user.id} />
          </div>
        )}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link href="/shop" className="btn-gold-outline" style={{ display: "inline-block", fontSize: "0.875rem" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
