"use client";

import { useState } from "react";
import { RotateCcw, Check, X } from "lucide-react";
import type { RefundRequest } from "@/types";
import { formatPrice } from "@/lib/utils";

interface RefundsTableProps {
  initialRefunds: RefundRequest[];
}

const REASON_LABELS: Record<string, string> = {
  damaged: "Item Damaged",
  wrong_item: "Wrong Item",
  not_as_described: "Not As Described",
  changed_mind: "Changed Mind",
  other: "Other",
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  denied: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function RefundsTable({ initialRefunds }: RefundsTableProps) {
  const [refunds, setRefunds] = useState(initialRefunds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handleAction(id: string, status: "approved" | "denied") {
    setLoadingId(id);
    await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_notes: notes[id] || null }),
    });
    setRefunds((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setLoadingId(null);
  }

  if (refunds.length === 0) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
        <RotateCcw size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} strokeWidth={1} />
        <p>No refund requests yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Reason</th>
            <th>Details</th>
            <th>Order Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {refunds.map((refund) => {
            const ss = STATUS_STYLE[refund.status];
            return (
              <tr key={refund.id}>
                <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>
                  #{refund.order_id.slice(0, 8)}
                </td>
                <td>
                  <p style={{ fontSize: "0.875rem", margin: "0 0 1px" }}>{refund.email}</p>
                </td>
                <td style={{ fontSize: "0.8rem" }}>
                  {REASON_LABELS[refund.reason] || refund.reason}
                </td>
                <td style={{ maxWidth: "200px" }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {refund.details || "—"}
                  </p>
                </td>
                <td style={{ color: "var(--gold)", fontWeight: 600 }}>
                  {refund.orders ? formatPrice(refund.orders.total) : "—"}
                </td>
                <td>
                  <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: ss.bg, color: ss.color }}>
                    {refund.status}
                  </span>
                </td>
                <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {new Date(refund.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td>
                  {refund.status === "pending" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: "160px" }}>
                      <input
                        placeholder="Admin notes (optional)"
                        value={notes[refund.id] || ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [refund.id]: e.target.value }))}
                        className="input-dark"
                        style={{ padding: "0.35rem 0.6rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "5px", color: "var(--text)", fontSize: "0.72rem", outline: "none" }}
                      />
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          onClick={() => handleAction(refund.id, "approved")}
                          disabled={loadingId === refund.id}
                          style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "6px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(refund.id, "denied")}
                          disabled={loadingId === refund.id}
                          style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
                        >
                          <X size={11} /> Deny
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: 0 }}>
                        {refund.admin_notes || "—"}
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
