"use client";

import { useState, useEffect } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface CategoryData {
  category_name: string;
  category_id: string;
  total_revenue: number;
  total_units: number;
  order_count: number;
  share: number;
  color: string;
}

interface CategoriesResponse {
  period: number;
  total_revenue: number;
  categories: CategoryData[];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function CategoriesTab({ period }: { period: number }) {
  const [data, setData] = useState<CategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/categories?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ height: "300px", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", animation: "pulse 2s infinite" }} />
        <div style={{ height: "300px", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", animation: "pulse 2s infinite" }} />
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
        <PieChartIcon size={32} style={{ color: "var(--muted)", marginBottom: "0.75rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No category revenue data available yet</p>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Category data will appear once orders with categorized products exist</p>
      </div>
    );
  }

  const pieData = data.categories.map((c) => ({
    name: c.category_name,
    value: c.total_revenue,
    color: c.color,
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <PieChartIcon size={18} style={{ color: "var(--gold)" }} /> Revenue by Category
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
          Category performance — last {period} days · Total: {formatPrice(data.total_revenue)}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Pie chart */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>Revenue Share</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.72rem", color: "var(--muted)" }}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => formatPrice(Number(value))}
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.categories.map((c) => (
            <div
              key={c.category_name}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div style={{ width: "6px", height: "36px", borderRadius: "3px", background: c.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", margin: 0 }}>{c.category_name}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.72rem", margin: "0.15rem 0 0" }}>
                  {c.total_units} units · {c.order_count} orders
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: c.color, fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-playfair)", margin: 0 }}>
                  {formatPrice(c.total_revenue)}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.72rem", margin: "0.15rem 0 0" }}>
                  {c.share}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gold-border)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Category Breakdown</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Revenue</th>
                <th>Units Sold</th>
                <th>Orders</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.category_name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color }} />
                      <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>{c.category_name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#10b981", fontWeight: 700 }}>{formatPrice(c.total_revenue)}</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>{c.total_units}</td>
                  <td style={{ color: "var(--muted)" }}>{c.order_count}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "9999px", overflow: "hidden", maxWidth: "80px" }}>
                        <div style={{ height: "100%", width: `${c.share}%`, background: c.color, borderRadius: "9999px", transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>{c.share}%</span>
                    </div>
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
