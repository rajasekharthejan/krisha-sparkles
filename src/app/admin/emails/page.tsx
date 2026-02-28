import { createClient } from "@supabase/supabase-js";

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  order_confirmation:  { label: "Order Confirmation",   icon: "🎉", color: "#10b981" },
  admin_order:         { label: "Admin Notification",   icon: "🛍️", color: "#c9a84c" },
  shipping:            { label: "Shipping Update",       icon: "📦", color: "#3b82f6" },
  refund_status:       { label: "Refund Status",         icon: "↩️", color: "#f59e0b" },
  welcome:             { label: "Welcome Email",         icon: "💎", color: "#8b5cf6" },
  abandoned_cart_1hr:  { label: "Abandoned Cart (1hr)",  icon: "🛒", color: "#f97316" },
  abandoned_cart_24hr: { label: "Abandoned Cart (24hr)", icon: "⏰", color: "#ef4444" },
  back_in_stock:       { label: "Back in Stock",         icon: "✨", color: "#06b6d4" },
  drip_day3:           { label: "Drip Day 3",            icon: "📧", color: "#a855f7" },
  drip_day7:           { label: "Drip Day 7",            icon: "🎁", color: "#ec4899" },
  review_request:      { label: "Review Request",        icon: "⭐", color: "#eab308" },
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminEmailsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: logs } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = logs ?? [];

  // Stats
  const total = rows.length;
  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed").length;

  const typeCounts = rows.reduce((acc: Record<string, number>, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", color: "var(--gold)", marginBottom: "0.5rem" }}>
        Email Log
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.875rem" }}>
        Every email sent through Krisha Sparkles — with Resend delivery status
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Sent", value: total, color: "var(--gold)" },
          { label: "Delivered to Resend", value: sent, color: "#10b981" },
          { label: "Failed", value: failed, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: "1.25rem 1.5rem", borderRadius: "10px" }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {Object.entries(typeCounts).map(([type, count]) => {
            const meta = TYPE_LABELS[type] || { label: type, icon: "📧", color: "#888" };
            return (
              <span key={type} style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--surface)", border: "1px solid var(--gold-border)", fontSize: "0.75rem", color: meta.color }}>
                {meta.icon} {meta.label} ({count})
              </span>
            );
          })}
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>
          <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>📭</p>
          <p style={{ fontSize: "1.1rem" }}>No emails logged yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Emails will appear here after the first order confirmation, welcome email, etc.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)", whiteSpace: "nowrap" }}>Type</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)" }}>To</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)" }}>Subject</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)", whiteSpace: "nowrap" }}>Resend ID</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)", whiteSpace: "nowrap" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = TYPE_LABELS[row.type] || { label: row.type, icon: "📧", color: "#888" };
                const isFailed = row.status === "failed";
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ color: meta.color, fontSize: "0.8rem", fontWeight: 600 }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "var(--text)" }}>
                      {row.to_email}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--muted)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.subject}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {isFailed ? (
                        <span title={row.error ?? ""} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, cursor: "help" }}>
                          ✗ Failed
                        </span>
                      ) : (
                        <span style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                          ✓ Sent
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {row.resend_id ? (
                        <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--muted)" }}>
                          {row.resend_id.slice(0, 8)}…
                        </span>
                      ) : (
                        <span style={{ color: "var(--subtle)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Domain warning box */}
      <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "10px", fontSize: "0.85rem" }}>
        <p style={{ color: "#fbbf24", fontWeight: 600, margin: "0 0 4px" }}>⚠️ If emails are showing as sent but not arriving:</p>
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          Go to <strong style={{ color: "var(--text)" }}>resend.com/domains</strong> and verify that <strong style={{ color: "var(--text)" }}>shopkrisha.com</strong> is added and shows <strong style={{ color: "#10b981" }}>Verified</strong>.
          Unverified domains cause Resend to silently drop all emails even when this log shows &quot;Sent&quot;.
        </p>
      </div>
    </div>
  );
}
