import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingBag, Package, ChevronRight, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  paid: "#10b981", shipped: "#3b82f6", delivered: "#22c55e",
  cancelled: "#ef4444", pending: "#f59e0b",
};
const STATUS_BG: Record<string, string> = {
  paid: "rgba(16,185,129,0.1)", shipped: "rgba(59,130,246,0.1)",
  delivered: "rgba(34,197,94,0.1)", cancelled: "rgba(239,68,68,0.1)",
  pending: "rgba(245,158,11,0.1)",
};

export default async function OrdersPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  let orders: { id: string; created_at: string; total: number; status: string; order_items?: { id: string; product_name: string; quantity: number; price: number }[] }[] = [];
  try {
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, total, status, order_items(id, product_name, quantity, price)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    orders = data || [];
  } catch { /* migration not run yet */ }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "2rem" }}>
          <ArrowLeft size={15} /> Back to Account
        </Link>

        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>Order History</h1>

        {orders.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "4rem", textAlign: "center" }}>
            <Package size={56} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 1.5rem", display: "block" }} strokeWidth={1} />
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>No orders yet</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Your orders will appear here after you make a purchase.</p>
            <Link href="/shop" className="btn-gold">Browse Collection</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="gold-hover-card"
                style={{
                  display: "block", padding: "1.5rem",
                  background: "var(--surface)", border: "1px solid var(--gold-border)",
                  borderRadius: "12px", textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.2rem" }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.75rem", borderRadius: "9999px",
                      fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize",
                      background: STATUS_BG[order.status] || "rgba(100,100,100,0.1)",
                      color: STATUS_COLOR[order.status] || "var(--muted)",
                    }}>
                      {order.status}
                    </span>
                    <span style={{ color: "var(--gold)", fontWeight: 700, fontFamily: "var(--font-playfair)", fontSize: "1rem" }}>
                      {formatPrice(order.total)}
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                  </div>
                </div>

                {/* Item preview */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {order.order_items?.slice(0, 3).map((item, i) => (
                    <span key={i} style={{ fontSize: "0.75rem", color: "var(--muted)", background: "var(--elevated)", padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                      {item.product_name} ×{item.quantity}
                    </span>
                  ))}
                  {(order.order_items?.length || 0) > 3 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>+{(order.order_items?.length || 0) - 3} more</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
