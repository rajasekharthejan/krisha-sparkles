"use client";

/**
 * /admin/analytics — Full analytics dashboard
 *
 * Sections:
 * 1. Revenue line chart (30/60/90 day toggle)
 * 2. Order status donut breakdown
 * 3. Top 10 products table
 * 4. Customer stats cards
 * 5. Low stock alerts
 * 6. CSV export button
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Users, Package,
  Download, BarChart3, AlertTriangle, RefreshCw
} from "lucide-react";

interface RevenueDay { date: string; revenue: number; orders: number }
interface TopProduct { product_name: string; total_sold: number; revenue: number }
interface CustomerStats { total_customers: number; repeat_customers: number; avg_order_value: number }
interface LowStockItem { id: string; name: string; stock_quantity: number }
interface RecentOrder { id: string; total: number; status: string; created_at: string; name: string }

interface AnalyticsData {
  period: number;
  revenue_by_day: RevenueDay[];
  top_products: TopProduct[];
  customer_stats: CustomerStats;
  status_breakdown: Record<string, number>;
  total_revenue: number;
  total_orders: number;
  newsletter_subscribers: number;
  total_subscribers: number;
  low_stock_items: LowStockItem[];
  recent_orders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  shipped: "#3b82f6",
  delivered: "#8b5cf6",
  cancelled: "#ef4444",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function MiniBarChart({ data }: { data: RevenueDay[] }) {
  if (!data.length) return <div style={{ color: "var(--muted)", fontSize: "0.8rem", padding: "2rem 0" }}>No data for period</div>;

  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue)));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px", overflowX: "auto", paddingBottom: "4px" }}>
      {data.map((d, i) => {
        const height = maxRevenue > 0 ? Math.max(4, (Number(d.revenue) / maxRevenue) * 100) : 4;
        return (
          <div
            key={i}
            title={`${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${formatPrice(Number(d.revenue))} (${d.orders} orders)`}
            style={{
              flex: 1,
              minWidth: "6px",
              height: `${height}%`,
              background: "linear-gradient(to top, #c9a84c, #e8c96a)",
              borderRadius: "2px 2px 0 0",
              cursor: "default",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
          />
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?period=${period}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `krisha-orders-${period}d.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const card = (label: string, value: string | number, sub?: string, color = "var(--gold)") => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ color, fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-playfair)", margin: 0 }}>{value}</p>
      {sub && <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={22} style={{ color: "var(--gold)" }} /> Analytics
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Real-time store performance insights</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Period toggle */}
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "3px" }}>
            {[30, 60, 90].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "6px",
                  border: "none",
                  background: period === p ? "var(--gold)" : "transparent",
                  color: period === p ? "#0a0a0a" : "var(--muted)",
                  fontWeight: period === p ? 700 : 400,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {p}d
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.55rem 1rem",
              background: "rgba(201,168,76,0.1)", border: "1px solid var(--gold-border)",
              borderRadius: "8px", color: "var(--gold)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, opacity: exporting ? 0.6 : 1,
            }}
          >
            <Download size={14} /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <button
            onClick={() => fetchData(period)}
            style={{ background: "none", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "0.55rem", cursor: "pointer", color: "var(--muted)" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem" }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", height: "100px", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {card("Revenue", formatPrice(data.total_revenue), `Last ${period} days`)}
            {card("Orders", data.total_orders, `Last ${period} days`, "#10b981")}
            {card("Customers", data.customer_stats?.total_customers || 0, `${data.customer_stats?.repeat_customers || 0} repeat buyers`, "#6366f1")}
            {card("Avg Order", formatPrice(Number(data.customer_stats?.avg_order_value || 0)), "All time", "#f59e0b")}
            {card("Newsletter", data.newsletter_subscribers, `${data.total_subscribers} total`, "#3b82f6")}
          </div>

          {/* Revenue chart */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={16} style={{ color: "var(--gold)" }} /> Revenue — Last {period} Days
            </h2>
            <MiniBarChart data={data.revenue_by_day} />
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem", textAlign: "right" }}>
              Hover bars for daily details
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Order status breakdown */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShoppingBag size={16} style={{ color: "var(--gold)" }} /> Orders by Status
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {Object.entries(data.status_breakdown).map(([status, count]) => {
                  const total = Object.values(data.status_breakdown).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "0.8rem" }}>
                        <span style={{ color: STATUS_COLORS[status] || "var(--muted)", textTransform: "capitalize", fontWeight: 600 }}>{status}</span>
                        <span style={{ color: "var(--muted)" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "9999px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: STATUS_COLORS[status] || "var(--gold)", borderRadius: "9999px", transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low stock alerts */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: data.low_stock_items.length > 0 ? "#f59e0b" : "inherit" }}>
                <AlertTriangle size={16} style={{ color: "#f59e0b" }} /> Low Stock ({data.low_stock_items.length})
              </h2>
              {data.low_stock_items.length === 0 ? (
                <p style={{ color: "#10b981", fontSize: "0.875rem" }}>✓ All products well-stocked</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                  {data.low_stock_items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0.75rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text)" }}>{item.name}</span>
                      <span style={{ fontSize: "0.8rem", color: item.stock_quantity === 0 ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>
                        {item.stock_quantity === 0 ? "Out of stock" : `${item.stock_quantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/admin/inventory" style={{ display: "inline-block", marginTop: "1rem", fontSize: "0.75rem", color: "var(--gold)", textDecoration: "none" }}>
                Manage inventory →
              </Link>
            </div>
          </div>

          {/* Top products */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gold-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Package size={16} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Top Products</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>No order data yet</td></tr>
                  ) : data.top_products.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>#{i + 1}</td>
                      <td style={{ fontWeight: 500, fontSize: "0.875rem" }}>{p.product_name}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 700 }}>{Number(p.total_sold)}</td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{formatPrice(Number(p.revenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer insights */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={16} style={{ color: "var(--gold)" }} /> Customer Insights
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem" }}>
              {[
                { label: "Total Customers", value: data.customer_stats?.total_customers || 0 },
                { label: "Repeat Buyers", value: data.customer_stats?.repeat_customers || 0 },
                {
                  label: "Repeat Rate",
                  value: data.customer_stats?.total_customers > 0
                    ? `${Math.round((Number(data.customer_stats.repeat_customers) / Number(data.customer_stats.total_customers)) * 100)}%`
                    : "—"
                },
                { label: "Avg Order Value", value: formatPrice(Number(data.customer_stats?.avg_order_value || 0)) },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "var(--elevated)", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid rgba(201,168,76,0.1)" }}>
                  <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{stat.label}</p>
                  <p style={{ color: "var(--gold)", fontSize: "1.35rem", fontWeight: 700, fontFamily: "var(--font-playfair)", margin: 0 }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>Failed to load analytics</div>
      )}
    </div>
  );
}
