import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminReferralsPage() {
  const supabase = await createAdminClient();
  
  let referrals: Array<{
    id: string; coupon_code: string; status: string; referee_email: string;
    referrer_reward_credit: number; created_at: string; completed_at: string | null;
    referrer_id: string;
  }> = [];
  
  try {
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });
    referrals = data || [];
  } catch { /* table may not exist yet */ }

  const completed = referrals.filter(r => r.status === "completed").length;
  const totalRewards = referrals.filter(r => r.status === "completed").reduce((s, r) => s + Number(r.referrer_reward_credit), 0);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Referral Program
        </h1>
        <p style={{ color: "var(--muted)" }}>Track all customer referrals and rewards.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Referrals", value: referrals.length, color: "var(--gold)" },
          { label: "Completed", value: completed, color: "#10b981" },
          { label: "Pending", value: referrals.length - completed, color: "#f59e0b" },
          { label: "Credits Awarded", value: `$${totalRewards.toFixed(2)}`, color: "#3b82f6" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{stat.label}</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {referrals.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎁</p>
          <p>No referrals yet. Customers can generate links from their account page.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Referrer ID</th>
                <th>Referee</th>
                <th>Status</th>
                <th>Reward</th>
                <th>Created</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--gold)", fontSize: "0.875rem" }}>{r.coupon_code}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>{r.referrer_id.slice(0, 8)}…</td>
                  <td style={{ fontSize: "0.875rem" }}>{r.referee_email || "—"}</td>
                  <td>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: r.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: r.status === "completed" ? "#10b981" : "#f59e0b", textTransform: "capitalize" }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>${Number(r.referrer_reward_credit).toFixed(2)}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{r.completed_at ? new Date(r.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
