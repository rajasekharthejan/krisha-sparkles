import { createAdminClient } from "@/lib/supabase/server";
import { Mail, Users } from "lucide-react";
import type { NewsletterSubscriber } from "@/types";

export default async function AdminNewsletterPage() {
  const supabase = await createAdminClient();

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  const all = (subscribers as NewsletterSubscriber[]) || [];
  const active = all.filter((s) => s.active).length;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={22} style={{ color: "var(--gold)" }} /> Newsletter
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {active} active subscriber{active !== 1 ? "s" : ""} · {all.length} total
          </p>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {[
            { label: "Active", value: active, color: "#10b981" },
            { label: "Unsubscribed", value: all.length - active, color: "#ef4444" },
            { label: "Total", value: all.length, color: "var(--gold)" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", padding: "0.75rem 1.25rem", textAlign: "center", minWidth: "80px" }}>
              <p style={{ fontSize: "1.4rem", fontWeight: 700, color: stat.color, fontFamily: "var(--font-playfair)", margin: "0 0 0.2rem" }}>{stat.value}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        {all.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
            <Users size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} strokeWidth={1} />
            <p>No subscribers yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {all.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 500, fontSize: "0.875rem" }}>{sub.email}</td>
                    <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{sub.name || "—"}</td>
                    <td>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600,
                        background: sub.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: sub.active ? "#10b981" : "#ef4444",
                      }}>
                        {sub.active ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {new Date(sub.subscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
