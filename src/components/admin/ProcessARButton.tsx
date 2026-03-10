"use client";

/**
 * ProcessARButton — Admin button to process product images through remove.bg
 * Generates transparent PNGs for AR Virtual Try-On overlay.
 *
 * Always shows the button. If REMOVE_BG_API_KEY is not configured,
 * clicking shows a helpful setup message instead of hiding the UI.
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
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(setStatus)
      .catch(() => {
        // If fetch fails (auth, network), set a default status so button still renders
        setStatus({ hasApiKey: false, total: 0, processed: 0, pending: 0 });
      });
  }, []);

  async function handleProcess() {
    // If no API key, show setup instructions instead of processing
    if (status && !status.hasApiKey) {
      setError(
        "REMOVE_BG_API_KEY not set. Get a free key at remove.bg/api → add to Vercel env vars → redeploy."
      );
      return;
    }

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
      if (statusRes.ok) {
        const newStatus = await statusRes.json();
        setStatus(newStatus);
      }
    } catch {
      setError("Network error — check your connection");
    } finally {
      setProcessing(false);
    }
  }

  const noApiKey = status && !status.hasApiKey;
  const allDone = status && status.hasApiKey && status.pending === 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <button
        onClick={handleProcess}
        disabled={processing || (allDone === true)}
        className="btn-gold-outline"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: processing ? 0.7 : 1,
          cursor: processing ? "wait" : allDone ? "default" : "pointer",
          borderColor: noApiKey ? "rgba(245,158,11,0.4)" : undefined,
        }}
      >
        {processing ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : allDone ? (
          <CheckCircle size={16} />
        ) : noApiKey ? (
          <AlertCircle size={16} style={{ color: "#f59e0b" }} />
        ) : (
          <Wand2 size={16} />
        )}
        {processing
          ? "Processing AR Images…"
          : allDone
          ? "All AR Images Ready"
          : noApiKey
          ? "Setup AR Images"
          : `Process AR Images${status?.pending ? ` (${status.pending})` : ""}`}
      </button>

      {/* Status badge */}
      {status && status.hasApiKey && status.total > 0 && !result && !error && (
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--muted)",
            padding: "0.25rem 0.6rem",
            background: "var(--elevated)",
            borderRadius: "6px",
          }}
        >
          {status.processed}/{status.total} AR-ready
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

      {/* Error / info message */}
      {error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: noApiKey ? "#f59e0b" : "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            maxWidth: "400px",
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
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
