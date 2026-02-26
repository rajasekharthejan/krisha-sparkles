import { createAdminClient } from "@/lib/supabase/server";
import { RotateCcw } from "lucide-react";
import RefundsTable from "./RefundsTable";
import type { RefundRequest } from "@/types";

export default async function AdminRefundsPage() {
  const supabase = await createAdminClient();

  const { data: refunds } = await supabase
    .from("refund_requests")
    .select("*, orders(id,total,status,created_at)")
    .order("created_at", { ascending: false });

  const allRefunds = (refunds as RefundRequest[]) || [];
  const pending = allRefunds.filter((r) => r.status === "pending").length;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RotateCcw size={22} style={{ color: "var(--gold)" }} /> Refund Requests
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {allRefunds.length} total
            {pending > 0 && <> · <span style={{ color: "#f59e0b" }}>{pending} pending</span></>}
          </p>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        <RefundsTable initialRefunds={allRefunds} />
      </div>
    </div>
  );
}
