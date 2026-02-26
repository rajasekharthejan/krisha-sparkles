"use client";

import { useState } from "react";
import { RotateCcw, X, Loader2, CheckCircle } from "lucide-react";

const REASONS = [
  { value: "damaged", label: "Item arrived damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
];

interface RefundRequestButtonProps {
  orderId: string;
  userEmail: string;
  userId: string;
}

export default function RefundRequestButton({ orderId, userEmail, userId }: RefundRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, user_id: userId, email: userEmail, reason, details }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to submit. Please try again.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", color: "#10b981", fontSize: "0.875rem" }}>
        <CheckCircle size={16} />
        Refund request submitted — our team will review it within 1–2 business days.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-gold-outline"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
      >
        <RotateCcw size={15} />
        Request Refund
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "16px",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
              animation: "zoomIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Request a Refund</h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="input-dark"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none" }}
                >
                  <option value="">Select a reason...</option>
                  {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Additional Details
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="input-dark"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", padding: "0.5rem 0.75rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px" }}>
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-gold-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                  {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><RotateCcw size={15} /> Submit</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
