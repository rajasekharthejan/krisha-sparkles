"use client";

import { useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import type { Review } from "@/types";

interface ReviewsTableProps {
  initialReviews: Review[];
}

export default function ReviewsTable({ initialReviews }: ReviewsTableProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject" | "delete") {
    setLoadingId(id);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });

    if (action === "delete") {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      setReviews((prev) =>
        prev.map((r) => r.id === id ? { ...r, approved: action === "approve" } : r)
      );
    }
    setLoadingId(null);
  }

  if (reviews.length === 0) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⭐</p>
        <p>No reviews yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Customer</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--muted)", fontFamily: "monospace" }}>
                {review.product_id.slice(0, 8)}…
              </td>
              <td style={{ fontSize: "0.875rem" }}>
                {review.user_profiles?.first_name
                  ? `${review.user_profiles.first_name} ${review.user_profiles.last_name || ""}`.trim()
                  : "User"}
                {review.verified_purchase && (
                  <span style={{ fontSize: "0.65rem", color: "#10b981", display: "block", fontWeight: 600 }}>✓ Verified</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      style={{
                        fill: s <= review.rating ? "#c9a84c" : "none",
                        color: s <= review.rating ? "#c9a84c" : "var(--subtle)",
                      }}
                    />
                  ))}
                </div>
              </td>
              <td style={{ maxWidth: "260px" }}>
                {review.title && <p style={{ fontSize: "0.8rem", fontWeight: 600, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{review.title}</p>}
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{review.body}</p>
              </td>
              <td>
                <span style={{
                  padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600,
                  background: review.approved ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: review.approved ? "#10b981" : "#f59e0b",
                }}>
                  {review.approved ? "Approved" : "Pending"}
                </span>
              </td>
              <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {!review.approved && (
                    <button
                      onClick={() => handleAction(review.id, "approve")}
                      disabled={loadingId === review.id}
                      title="Approve"
                      style={{
                        padding: "0.35rem 0.6rem", borderRadius: "6px",
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s",
                      }}
                    >
                      <Check size={12} /> Approve
                    </button>
                  )}
                  {review.approved && (
                    <button
                      onClick={() => handleAction(review.id, "reject")}
                      disabled={loadingId === review.id}
                      title="Reject"
                      style={{
                        padding: "0.35rem 0.6rem", borderRadius: "6px",
                        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s",
                      }}
                    >
                      <X size={12} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(review.id, "delete")}
                    disabled={loadingId === review.id}
                    title="Delete"
                    style={{
                      padding: "0.35rem 0.6rem", borderRadius: "6px",
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                      color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
