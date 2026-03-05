"use client";

import { useState, useEffect } from "react";
import { Crown, Users, TrendingUp, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { LOYALTY_TIERS, TIER_ORDER, type LoyaltyTierName } from "@/lib/loyalty-tiers";

interface LoyaltyUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  loyalty_tier: LoyaltyTierName;
  lifetime_points: number;
  points_balance: number;
  tier_upgraded_at: string | null;
  birthday: string | null;
}

interface LoyaltyData {
  distribution: Record<string, number>;
  total_users: number;
  total_lifetime_points: number;
  users: LoyaltyUser[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminLoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterTier) params.set("tier", filterTier);
    params.set("page", String(page));

    fetch(`/api/admin/loyalty?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterTier, page]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={28} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data) return <p style={{ color: "var(--muted)", padding: "2rem" }}>Failed to load loyalty data.</p>;

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Crown size={24} style={{ color: "var(--gold)" }} />
          Loyalty Tiers
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Member tier distribution and points overview
        </p>
      </div>

      {/* Tier Distribution Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {TIER_ORDER.map((tn) => {
          const t = LOYALTY_TIERS[tn];
          const count = data.distribution[tn] || 0;
          const pct = data.total_users > 0 ? Math.round((count / data.total_users) * 100) : 0;
          const isActive = filterTier === tn;
          return (
            <button
              key={tn}
              onClick={() => { setFilterTier(isActive ? "" : tn); setPage(1); }}
              style={{
                background: isActive ? t.bgColor : "var(--surface)",
                border: `2px solid ${isActive ? t.color : "var(--gold-border)"}`,
                borderRadius: "14px", padding: "1.25rem",
                cursor: "pointer", textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <p style={{ fontSize: "1.75rem", margin: "0 0 0.3rem" }}>{t.icon}</p>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: t.color, margin: "0 0 0.1rem" }}>
                {count}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                {t.label} ({pct}%)
              </p>
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Users size={22} style={{ color: "var(--gold)" }} />
          <div>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>
              {data.total_users.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>Total Members</p>
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <TrendingUp size={22} style={{ color: "#10b981" }} />
          <div>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "#10b981", margin: 0 }}>
              {data.total_lifetime_points.toLocaleString()}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>Total Lifetime Points Earned</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "14px", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--gold-border)",
          background: "rgba(201,168,76,0.05)",
        }}>
          <span style={thStyle}>User</span>
          <span style={thStyle}>Tier</span>
          <span style={thStyle}>Lifetime Pts</span>
          <span style={thStyle}>Balance</span>
          <span style={thStyle}>Upgraded</span>
        </div>

        {data.users.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Star size={36} style={{ color: "var(--subtle)", margin: "0 auto 0.75rem", display: "block" }} strokeWidth={1} />
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No members found.</p>
          </div>
        ) : (
          data.users.map((u, i) => {
            const t = LOYALTY_TIERS[u.loyalty_tier] || LOYALTY_TIERS.bronze;
            return (
              <div
                key={u.id}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "0.85rem 1.25rem",
                  borderBottom: i < data.users.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", margin: 0 }}>
                    {u.first_name || u.last_name
                      ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                      : "—"}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: "0.72rem", margin: 0 }}>{u.email || "—"}</p>
                </div>
                <div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    fontSize: "0.78rem", fontWeight: 700, color: t.color,
                    background: t.bgColor, border: `1px solid ${t.borderColor}`,
                    padding: "2px 8px", borderRadius: "6px",
                  }}>
                    {t.icon} {t.label}
                  </span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#10b981" }}>
                  {(u.lifetime_points || 0).toLocaleString()}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gold)" }}>
                  {(u.points_balance || 0).toLocaleString()}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {u.tier_upgraded_at
                    ? new Date(u.tier_upgraded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                    : "—"}
                </span>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem",
            padding: "1rem", borderTop: "1px solid var(--gold-border)",
          }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px",
                padding: "0.3rem 0.6rem", cursor: page > 1 ? "pointer" : "default",
                color: page > 1 ? "var(--gold)" : "var(--subtle)",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px",
                padding: "0.3rem 0.6rem", cursor: page < totalPages ? "pointer" : "default",
                color: page < totalPages ? "var(--gold)" : "var(--subtle)",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em",
};
