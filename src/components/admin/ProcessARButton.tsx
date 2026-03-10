"use client";

/**
 * ProcessARButton — Admin button to process product images through remove.bg
 *
 * Processes ONE image at a time (Vercel 10s serverless timeout safe).
 * Shows live progress as each image is processed.
 */

import { useState, useEffect, useRef } from "react";
import { Wand2, Loader2, CheckCircle, AlertCircle, Square } from "lucide-react";

interface ARStatus {
  hasApiKey: boolean;
  total: number;
  processed: number;
  pending: number;
  pendingImages: { productId: string; productName: string; imageIndex: number; imageUrl: string }[];
}

export default function ProcessARButton() {
  const [status, setStatus] = useState<ARStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const r = await fetch("/api/admin/products/remove-bg");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setStatus(data);
    } catch {
      setStatus({ hasApiKey: false, total: 0, processed: 0, pending: 0, pendingImages: [] });
    }
  }

  async function handleProcess() {
    if (status && !status.hasApiKey) {
      setError("REMOVE_BG_API_KEY not set. Get a free key at remove.bg/api → add to Vercel env vars → redeploy.");
      return;
    }

    if (!status?.pendingImages?.length) {
      setError("No images to process");
      return;
    }

    setProcessing(true);
    setResult(null);
    setError(null);
    abortRef.current = false;

    const pending = status.pendingImages;
    let done = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) break;

      const item = pending[i];
      setProgress(`Processing ${i + 1}/${pending.length}: ${item.productName}`);

      try {
        const res = await fetch("/api/admin/products/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId, imageIndex: item.imageIndex }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) done++;
          else failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setProcessing(false);
    setProgress("");

    if (abortRef.current) {
      setResult(`Stopped. ${done} images processed${failed ? `, ${failed} failed` : ""}.`);
    } else {
      setResult(`Done! ${done} images processed${failed ? `, ${failed} failed` : ""}.`);
    }

    // Refresh status
    await fetchStatus();
  }

  function handleStop() {
    abortRef.current = true;
  }

  const noApiKey = status && !status.hasApiKey;
  const allDone = status && status.hasApiKey && (status.pendingImages?.length === 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      {processing ? (
        <>
          <button
            onClick={handleStop}
            className="btn-gold-outline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderColor: "rgba(239,68,68,0.4)",
              color: "#ef4444",
            }}
          >
            <Square size={14} />
            Stop
          </button>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            {progress}
          </span>
        </>
      ) : (
        <button
          onClick={handleProcess}
          disabled={allDone === true}
          className="btn-gold-outline"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: allDone ? "default" : "pointer",
            borderColor: noApiKey ? "rgba(245,158,11,0.4)" : undefined,
          }}
        >
          {allDone ? (
            <CheckCircle size={16} />
          ) : noApiKey ? (
            <AlertCircle size={16} style={{ color: "#f59e0b" }} />
          ) : (
            <Wand2 size={16} />
          )}
          {allDone
            ? "All AR Images Ready"
            : noApiKey
            ? "Setup AR Images"
            : `Process AR Images${status?.pendingImages?.length ? ` (${status.pendingImages.length})` : ""}`}
        </button>
      )}

      {/* Status badge */}
      {status && status.hasApiKey && status.total > 0 && !processing && !result && !error && (
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

      {/* Result */}
      {result && (
        <span style={{ fontSize: "0.75rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <CheckCircle size={14} />
          {result}
        </span>
      )}

      {/* Error */}
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
