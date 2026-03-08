"use client";

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LtvData {
  avg_ltv: number;
  median_ltv: number;
  top_10_pct_ltv: number;
  total_customers: number;
  ltv_distribution: { label: string; count: number }[];
  top_customers: {
    email: string;
    name: string;
    total_spent: number;
    order_count: number;
    first_purchase: string;
    last_purchase: string;
    avg_order_value: number;
  }[];
  ltv_trend: { month: string; avg_ltv: number; customers: number }[];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + "-01");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GoldTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.8rem" }}>
      <p style={{ color: "var(--muted)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ color: "var(--gold)", fontWeight: 600, margin: 0 }}>
        {typeof payload[0].value === "number" ? formatPrice(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

export default function LtvTab() {
  const [data, setData] = useState<LtvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/ltv")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const card = (label: string, value: string, color = "var(--gold)") => (
    <div style={{ background: "var(--elevated)", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid rgba(201,168,76,0.1)" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{label}</p>
      <p style={{ color, fontSize: "1.35rem", fontWeight: 700, fontFamily: "var(--font-playfair)", margin: 0 }}>{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", height: "80px", animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  if (!data || data.total_customers === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
        <DollarSign size={32} style={{ color: "var(--muted)", marginBottom: "0.75rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No lifetime value data available yet</p>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>LTV data will appear once customers place orders</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <DollarSign size={18} style={{ color: "var(--gold)" }} /> Customer Lifetime Value
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
          Understand how much each customer is worth over their lifetime
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {card("Average LTV", formatPrice(data.avg_ltv))}
        {card("Median LTV", formatPrice(data.median_ltv), "#10b981")}
        {card("Top 10% LTV", formatPrice(data.top_10_pct_ltv), "#f59e0b")}
        {card("Total Customers", String(data.total_customers), "#6366f1")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* LTV Distribution */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>LTV Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.ltv_distribution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<GoldTooltip />} />
              <Bar dataKey="count" fill="url(#goldBarGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* LTV Trend */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>Avg LTV by Acquisition Month</h3>
          {data.ltv_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.ltv_trend.map((t) => ({ ...t, month: formatMonth(t.month) }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={45} />
                <Tooltip content={<GoldTooltip />} />
                <Area type="monotone" dataKey="avg_ltv" stroke="#c9a84c" strokeWidth={2} fill="url(#goldAreaGradient)" dot={false} activeDot={{ r: 5, fill: "#c9a84c", stroke: "#0a0a0a", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
              Not enough data for trend
            </div>
          )}
        </div>
      </div>

      {/* Top Customers Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gold-border)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Top Customers by Lifetime Value</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Avg Order</th>
                <th>First Purchase</th>
              </tr>
            </thead>
            <tbody>
              {data.top_customers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No customer data yet</td></tr>
              ) : data.top_customers.map((c, i) => (
                <tr key={c.email}>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>#{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{c.name || "—"}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{c.email}</div>
                  </td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>{c.order_count}</td>
                  <td style={{ color: "#10b981", fontWeight: 700 }}>{formatPrice(c.total_spent)}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{formatPrice(c.avg_order_value)}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    {new Date(c.first_purchase).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
