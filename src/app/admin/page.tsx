import { createAdminClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import ChartsLoader from "@/components/admin/ChartsLoader";
import type { RevenueDataPoint, StatusDataPoint } from "@/components/admin/DashboardCharts";

async function getStats() {
  try {
    const supabase = await createAdminClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: orders },
      { count: productCount },
      { data: lowStock },
      { data: recentOrders },
      { data: recentOrdersForCharts },
    ] = await Promise.all([
      supabase.from("orders").select("total, status"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
      supabase.from("products").select("id, name, stock_quantity").eq("active", true).lte("stock_quantity", 5).gt("stock_quantity", 0).order("stock_quantity"),
      supabase.from("orders").select("id, email, total, status, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("orders").select("total, status, created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
    ]);

    const totalRevenue = orders?.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0) || 0;
    const totalOrders = orders?.length || 0;
    const paidOrders = orders?.filter(o => o.status === "paid" || o.status === "shipped" || o.status === "delivered").length || 0;

    // ── Build 14-day revenue buckets ─────────────────────────
    const revenueByDay: RevenueDataPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const dayRevenue = (recentOrdersForCharts || [])
        .filter(o => o.status !== "cancelled" && o.created_at?.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + o.total, 0);
      revenueByDay.push({ date: label, revenue: Math.round(dayRevenue * 100) / 100 });
    }

    // ── Build order status counts ────────────────────────────
    const allOrders = orders || [];
    const statusCounts: StatusDataPoint[] = [
      { name: "Pending",   value: allOrders.filter(o => o.status === "pending").length,   color: "#f59e0b" },
      { name: "Paid",      value: allOrders.filter(o => o.status === "paid").length,      color: "#10b981" },
      { name: "Shipped",   value: allOrders.filter(o => o.status === "shipped").length,   color: "#3b82f6" },
      { name: "Delivered", value: allOrders.filter(o => o.status === "delivered").length, color: "#8b5cf6" },
      { name: "Cancelled", value: allOrders.filter(o => o.status === "cancelled").length, color: "#ef4444" },
    ];

    return {
      totalRevenue,
      totalOrders,
      paidOrders,
      productCount: productCount || 0,
      lowStock: lowStock || [],
      recentOrders: recentOrders || [],
      revenueByDay,
      statusCounts,
    };
  } catch {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      productCount: 0,
      lowStock: [],
      recentOrders: [],
      revenueByDay: [] as RevenueDataPoint[],
      statusCounts: [] as StatusDataPoint[],
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: <DollarSign size={22} />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: <ShoppingCart size={22} />,
      color: "var(--gold)",
      bg: "var(--gold-muted)",
    },
    {
      label: "Active Products",
      value: stats.productCount.toString(),
      icon: <Package size={22} />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders.toString(),
      icon: <TrendingUp size={22} />,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
    },
  ];

  const statusBadgeStyle = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      paid:      { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
      shipped:   { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
      delivered: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
      cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    };
    return map[status] || { color: "var(--muted)", bg: "rgba(255,255,255,0.05)" };
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          Welcome back! Here&apos;s what&apos;s happening with Krisha Sparkles.
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "12px",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              animation: `slideUp 0.4s ease ${i * 0.1}s both`,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: card.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: card.color,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <ChartsLoader revenueData={stats.revenueByDay} statusData={stats.statusCounts} />

      {/* Recent Orders + Low Stock */}
      <div className="admin-main-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Recent Orders */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--gold-border)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700 }}>
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.8rem" }}
            >
              View All
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
              <ShoppingCart size={36} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p style={{ fontSize: "0.875rem" }}>No orders yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: {
                    id: string;
                    email: string;
                    total: number;
                    status: string;
                    created_at: string;
                  }) => {
                    const badge = statusBadgeStyle(order.status);
                    return (
                      <tr key={order.id}>
                        <td style={{ fontSize: "0.8rem" }}>{order.email}</td>
                        <td style={{ color: "var(--gold)", fontWeight: 600 }}>{formatPrice(order.total)}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ color: badge.color, background: badge.bg }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(order.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--gold-border)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700 }}>
              Low Stock
            </h2>
          </div>
          {stats.lowStock.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
              <p style={{ fontSize: "0.875rem" }}>All products are well stocked</p>
            </div>
          ) : (
            <div style={{ padding: "0.5rem" }}>
              {stats.lowStock.map((product: { id: string; name: string; stock_quantity: number }) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}/edit`}
                  className="admin-row-link"
                >
                  <span style={{ fontSize: "0.8rem", color: "var(--text)" }}>{product.name}</span>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      background: product.stock_quantity <= 2 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: product.stock_quantity <= 2 ? "#ef4444" : "#f59e0b",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    {product.stock_quantity} left
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
