"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { TrendingUp } from "lucide-react";

interface AffiliateRow {
  code: string;
  influencer_name: string | null;
  campaign: string | null;
  uses_count: number;
  revenue: number;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AffiliatesPage() {
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Get influencer/affiliate coupons
    const { data: coupons } = await supabase
      .from("coupons")
      .select("code, influencer_name, campaign, uses_count, discount_type, discount_value")
      .in("source", ["influencer", "partner", "campaign"])
      .order("uses_count", { ascending: false });

    if (!coupons) { setLoading(false); return; }

    // For each coupon, get total revenue from orders using that coupon
    const rowsData: AffiliateRow[] = await Promise.all(
      coupons.map(async (c) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("total")
          .eq("coupon_code", c.code);
        const revenue = (orders || []).reduce((s: number, o: { total: number }) => s + o.total, 0);
        return {
          code: c.code,
          influencer_name: c.influencer_name,
          campaign: c.campaign,
          uses_count: c.uses_count,
          revenue,
        };
      })
    );

    setRows(rowsData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.uses_count, 0);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Affiliates</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Track influencer &amp; affiliate coupon performance
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Active Partners", value: rows.length },
          { label: "Total Orders", value: totalOrders },
          { label: "Revenue Generated", value: `$${totalRevenue.toFixed(2)}` },
          { label: "Avg Order Value", value: totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : "—" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading...</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
          <TrendingUp size={48} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 1rem", display: "block" }} strokeWidth={1} />
          <p style={{ color: "var(--muted)" }}>No affiliate coupons yet.</p>
          <p style={{ color: "var(--subtle)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Create coupons with source set to &ldquo;influencer&rdquo; or &ldquo;partner&rdquo; in the Promotions page.
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden" }}>
          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Influencer / Partner</th>
                <th>Campaign</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>AOV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--gold)", fontSize: "0.95rem" }}>{r.code}</td>
                  <td style={{ color: "var(--text)", fontSize: "0.875rem" }}>{r.influencer_name || "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{r.campaign || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{r.uses_count}</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>${r.revenue.toFixed(2)}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                    {r.uses_count > 0 ? `$${(r.revenue / r.uses_count).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
