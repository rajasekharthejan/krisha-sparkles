"use client";

import { useState, useEffect } from "react";
import { Filter, ArrowDown } from "lucide-react";

interface FunnelData {
  period: number;
  steps: { name: string; count: number; rate: number }[];
}

const STEP_COLORS = [
  "#c9a84c", // All Orders — gold
  "#10b981", // Paid — emerald
  "#3b82f6", // Shipped — blue
  "#8b5cf6", // Delivered — violet
  "#f59e0b", // Repeat — amber
];

export default function FunnelsTab({ period }: { period: number }) {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/funnels?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: "50px", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  if (!data || data.steps.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
        <Filter size={32} style={{ color: "var(--muted)", marginBottom: "0.75rem" }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No conversion data available yet</p>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Funnel data will appear once orders are placed</p>
      </div>
    );
  }

  const maxCount = data.steps[0]?.count || 1;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <Filter size={18} style={{ color: "var(--gold)" }} /> Order Conversion Funnel
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
          Track order progression — last {period} days
        </p>
      </div>

      {/* Funnel visualization */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "2rem" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {data.steps.map((step, i) => {
            const widthPct = maxCount > 0 ? Math.max(15, (step.count / maxCount) * 100) : 15;
            const color = STEP_COLORS[i % STEP_COLORS.length];
            const prevStep = i > 0 ? data.steps[i - 1] : null;
            const dropoff = prevStep && prevStep.count > 0
              ? Math.round(((prevStep.count - step.count) / prevStep.count) * 100)
              : 0;

            return (
              <div key={step.name}>
                {/* Drop-off indicator between steps */}
                {i > 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.4rem 0", gap: "0.4rem" }}>
                    <ArrowDown size={14} style={{ color: "var(--muted)" }} />
                    <span style={{ fontSize: "0.72rem", color: dropoff > 50 ? "#ef4444" : "var(--muted)", fontWeight: 600 }}>
                      {dropoff > 0 ? `−${dropoff}% drop-off` : "→"}
                    </span>
                  </div>
                )}

                {/* Funnel bar */}
                <div
                  style={{
                    width: `${widthPct}%`,
                    margin: "0 auto",
                    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                    border: `1px solid ${color}66`,
                    borderRadius: "8px",
                    padding: "0.85rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "width 0.5s ease",
                    minWidth: "200px",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>
                    {step.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color, fontFamily: "var(--font-playfair)" }}>
                      {step.count}
                    </span>
                    <span style={{
                      background: `${color}22`,
                      border: `1px solid ${color}44`,
                      borderRadius: "20px",
                      padding: "0.15rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color,
                    }}>
                      {step.rate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "1rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--gold-border)" }}>
          {data.steps.map((step, i) => (
            <div key={step.name} style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>{step.name}</p>
              <p style={{ color: STEP_COLORS[i % STEP_COLORS.length], fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-playfair)", margin: 0 }}>{step.count}</p>
            </div>
          ))}
        </div>

        {/* Note */}
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "1.5rem", textAlign: "center", fontStyle: "italic" }}>
          This funnel tracks order status progression. Page visits and cart additions require client-side event tracking (future enhancement).
        </p>
      </div>
    </div>
  );
}
