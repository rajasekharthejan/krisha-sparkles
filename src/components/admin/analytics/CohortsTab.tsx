"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";

interface CohortData {
  month: string;
  initial_customers: number;
  retention: number[];
  revenue: number[];
}

interface CohortsResponse {
  months: number;
  max_offset: number;
  cohorts: CohortData[];
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getCellBg(pct: number) {
  if (pct === 0) return "rgba(255,255,255,0.02)";
  const opacity = Math.min(0.6, (pct / 100) * 0.6);
  return `rgba(201,168,76,${opacity})`;
}

export default function CohortsTab({ period }: { period: number }) {
  void period; // Cohorts uses months toggle, not period
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<CohortsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics/cohorts?months=${months}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [months]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Users size={18} style={{ color: "var(--gold)" }} /> Customer Cohort Retention
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Track how well you retain customers from each acquisition month
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "3px" }}>
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: "none",
                background: months === m ? "var(--gold)" : "transparent",
                color: months === m ? "#0a0a0a" : "var(--muted)",
                fontWeight: months === m ? 700 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {m}mo
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "40px", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : !data || data.cohorts.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "3rem", textAlign: "center" }}>
          <Users size={32} style={{ color: "var(--muted)", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No cohort data available yet</p>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Cohort data will appear once you have customers with orders</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: "var(--surface)", zIndex: 1 }}>Cohort</th>
                  <th style={{ textAlign: "center" }}>Customers</th>
                  {Array.from({ length: Math.min(data.max_offset + 1, months) }, (_, i) => (
                    <th key={i} style={{ textAlign: "center", minWidth: "60px" }}>
                      {i === 0 ? "M0" : `M${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((cohort) => (
                  <tr key={cohort.month}>
                    <td style={{ position: "sticky", left: 0, background: "var(--surface)", zIndex: 1, fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {formatMonth(cohort.month)}
                    </td>
                    <td style={{ textAlign: "center", color: "var(--gold)", fontWeight: 700, fontSize: "0.85rem" }}>
                      {cohort.initial_customers}
                    </td>
                    {Array.from({ length: Math.min(data.max_offset + 1, months) }, (_, i) => {
                      const pct = cohort.retention[i] ?? null;
                      if (pct === null) {
                        return <td key={i} style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.75rem" }}>—</td>;
                      }
                      return (
                        <td
                          key={i}
                          style={{
                            textAlign: "center",
                            background: getCellBg(pct),
                            color: pct >= 50 ? "#0a0a0a" : "var(--text)",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            transition: "background 0.3s",
                          }}
                          title={`${pct}% retention in month ${i}`}
                        >
                          {pct}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--gold-border)", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Retention Scale:</span>
            {[0, 25, 50, 75, 100].map((pct) => (
              <div key={pct} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: getCellBg(pct), border: "1px solid var(--gold-border)" }} />
                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
