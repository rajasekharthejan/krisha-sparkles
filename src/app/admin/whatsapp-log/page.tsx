import { createClient } from "@supabase/supabase-js";

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  admin_new_order:     { label: "Admin Order Alert",     icon: "🛍️", color: "#c9a84c" },
  order_confirmation:  { label: "Order Confirmation",    icon: "✨",  color: "#10b981" },
  shipping_update:     { label: "Shipping Update",       icon: "📦",  color: "#3b82f6" },
  label_created:       { label: "Label Created",         icon: "📋",  color: "#8b5cf6" },
  in_transit:          { label: "In Transit",            icon: "🚚",  color: "#06b6d4" },
  out_for_delivery:    { label: "Out for Delivery",      icon: "🏃",  color: "#f97316" },
  delivered:           { label: "Delivered",             icon: "✅",  color: "#22c55e" },
  cancelled:           { label: "Cancelled",             icon: "❌",  color: "#ef4444" },
  refund_update:       { label: "Refund Update",         icon: "💚",  color: "#f59e0b" },
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPhoneDisplay(phone: string) {
  if (phone.length === 11 && phone.startsWith("1")) {
    return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
  }
  return `+${phone}`;
}

function truncateMessage(msg: string, max = 80) {
  // Remove WhatsApp markdown formatting for display
  const clean = msg.replace(/\*/g, "").replace(/\n/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

export default async function AdminWhatsAppLogPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: logs } = await supabase
    .from("whatsapp_logs")
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
        📱 WhatsApp Log
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.875rem" }}>
        Every WhatsApp message sent through Krisha Sparkles — with delivery status
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Messages", value: total, color: "var(--gold)" },
          { label: "Sent Successfully", value: sent, color: "#10b981" },
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
            const meta = TYPE_LABELS[type] || { label: type, icon: "📱", color: "#888" };
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
          <p style={{ fontSize: "3rem", margin: "0 0 1rem" }}>📱</p>
          <p style={{ fontSize: "1.1rem" }}>No WhatsApp messages logged yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Messages will appear here after the first order with WhatsApp notifications enabled.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Type", "To", "Message", "Status", "WA ID", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--gold-border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = TYPE_LABELS[row.type] || { label: row.type, icon: "📱", color: "#888" };
                const isFailed = row.status === "failed";
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ color: meta.color, fontSize: "0.8rem", fontWeight: 600 }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "var(--text)", whiteSpace: "nowrap" }}>
                      {formatPhoneDisplay(row.to_phone)}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.message}>
                      {truncateMessage(row.message)}
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
                      {row.wa_message_id ? (
                        <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--muted)" }}>
                          {row.wa_message_id.slice(0, 12)}…
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

      {/* Info box */}
      <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "10px", fontSize: "0.85rem" }}>
        <p style={{ color: "#25d366", fontWeight: 600, margin: "0 0 4px" }}>💡 WhatsApp Business API</p>
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          Messages are sent via the <strong style={{ color: "var(--text)" }}>Meta WhatsApp Business Cloud API</strong>.
          Customers must opt in during checkout. Admin alerts go to both admin numbers on every new order.
          If messages show as &quot;Sent&quot; but aren&apos;t received, check your WhatsApp Business token in{" "}
          <strong style={{ color: "var(--text)" }}>Meta Business Suite → WhatsApp → API Setup</strong>.
        </p>
      </div>
    </div>
  );
}
