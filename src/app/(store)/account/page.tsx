import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { User, ShoppingBag, Package, ChevronRight, Star, Gift, Crown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getTierConfig, type LoyaltyTierName } from "@/lib/loyalty-tiers";

export default async function AccountPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  // Fetch last 3 orders for this user (graceful if user_id column doesn't exist yet)
  let orders: { id: string; created_at: string; total: number; status: string; order_items?: { id: string }[] }[] = [];
  let profile: { first_name?: string; last_name?: string; points_balance?: number; loyalty_tier?: string; lifetime_points?: number } | null = null;

  try {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, created_at, total, status, order_items(id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    orders = ordersData || [];
  } catch { /* migration not run yet */ }

  try {
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("first_name, last_name, points_balance, loyalty_tier, lifetime_points")
      .eq("id", user.id)
      .single();
    profile = profileData;
  } catch { /* migration not run yet */ }

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : user.email?.split("@")[0] || "Customer";

  const statusColor: Record<string, string> = {
    paid: "#10b981", shipped: "#3b82f6", delivered: "#22c55e",
    cancelled: "#ef4444", pending: "#f59e0b",
  };

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--gold-muted)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={24} style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { href: "/account/orders", icon: <ShoppingBag size={22} style={{ color: "var(--gold)" }} />, title: "My Orders", desc: "Track and view your orders" },
            { href: "/account/profile", icon: <User size={22} style={{ color: "var(--gold)" }} />, title: "Edit Profile", desc: "Name, phone, address" },
            { href: "/account/points", icon: <Crown size={22} style={{ color: getTierConfig((profile?.loyalty_tier || "bronze") as LoyaltyTierName).color }} />, title: `${getTierConfig((profile?.loyalty_tier || "bronze") as LoyaltyTierName).icon} ${getTierConfig((profile?.loyalty_tier || "bronze") as LoyaltyTierName).label} Member`, desc: `${(profile?.points_balance ?? 0).toLocaleString()} pts · ${getTierConfig((profile?.loyalty_tier || "bronze") as LoyaltyTierName).pointsMultiplier}x earning` },
            { href: "/account/referrals", icon: <Gift size={22} style={{ color: "var(--gold)" }} />, title: "Refer a Friend", desc: "Earn $5 credit per referral" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="gold-hover-card"
              style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1.25rem 1.5rem",
                background: "var(--surface)", border: "1px solid var(--gold-border)",
                borderRadius: "12px", textDecoration: "none",
              }}
            >
              {card.icon}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{card.title}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>{card.desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted)" }} />
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Recent Orders</h2>
            <Link href="/account/orders" style={{ color: "var(--gold)", fontSize: "0.875rem", textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {!orders || orders.length === 0 ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
              <Package size={48} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 1rem", display: "block" }} strokeWidth={1} />
              <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>No orders yet</p>
              <Link href="/shop" className="btn-gold" style={{ display: "inline-block" }}>Start Shopping</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="gold-hover-card"
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1.25rem 1.5rem",
                    background: "var(--surface)", border: "1px solid var(--gold-border)",
                    borderRadius: "12px", textDecoration: "none",
                  }}
                >
                  <ShoppingBag size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: "0.875rem", margin: 0 }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{formatPrice(order.total)}</p>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize", color: statusColor[order.status] || "var(--muted)" }}>
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
