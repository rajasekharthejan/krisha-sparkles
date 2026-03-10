"use client";

/**
 * ProcessARButton — Admin button to process product images through remove.bg
 * Generates transparent PNGs for AR Virtual Try-On overlay.
 */

import { useState, useEffect } from "react";
import { Wand2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ARStatus {
  hasApiKey: boolean;
  total: number;
  processed: number;
  pending: number;
}

export default function ProcessARButton() {
  const [status, setStatus] = useState<ARStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetch("/api/admin/products/remove-bg")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function handleProcess() {
    setProcessing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/products/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Processing failed");
        return;
      }

      setResult(
        `Done! ${data.images_processed} images processed across ${data.products_processed} products` +
        (data.images_failed ? ` (${data.images_failed} failed)` : "")
      );

      // Refresh status
      const statusRes = await fetch("/api/admin/products/remove-bg");
      const newStatus = await statusRes.json();
      setStatus(newStatus);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setProcessing(false);
    }
  }

  // Don't show if API key not configured
  if (status && !status.hasApiKey) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.85rem",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "8px",
          fontSize: "0.72rem",
          color: "#f59e0b",
        }}
        title="Add REMOVE_BG_API_KEY to .env.local for AR image processing"
      >
        <AlertCircle size={14} />
        <span>AR: No API key</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <button
        onClick={handleProcess}
        disabled={processing || (status?.pending === 0)}
        className="btn-gold-outline"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: processing ? 0.7 : 1,
          cursor: processing ? "wait" : (status?.pending === 0) ? "default" : "pointer",
        }}
      >
        {processing ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : status?.pending === 0 ? (
          <CheckCircle size={16} />
        ) : (
          <Wand2 size={16} />
        )}
        {processing
          ? "Processing AR Images…"
          : status?.pending === 0
          ? "All AR Images Ready"
          : `Process AR Images${status?.pending ? ` (${status.pending})` : ""}`}
      </button>

      {/* Status badge */}
      {status && status.total > 0 && !result && !error && (
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--muted)",
            padding: "0.25rem 0.6rem",
            background: "var(--elevated)",
            borderRadius: "6px",
          }}
        >
          {status.processed}/{status.total} products AR-ready
        </span>
      )}

      {/* Result message */}
      {result && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <CheckCircle size={14} />
          {result}
        </span>
      )}

      {/* Error message */}
      {error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <AlertCircle size={14} />
          {error}
        </span>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
