"use client";

/**
 * ProductARButton — Per-product AR image processing button.
 * Processes each image for a single product one at a time.
 */

import { useState } from "react";
import { Wand2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
  imageCount: number;
  arReadyCount: number;
}

export default function ProductARButton({ productId, productName, imageCount, arReadyCount }: Props) {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(arReadyCount);
  const [error, setError] = useState("");

  const allDone = done >= imageCount && imageCount > 0;

  async function handleProcess() {
    if (allDone || imageCount === 0) return;
    setProcessing(true);
    setError("");

    let completed = done;

    for (let i = 0; i < imageCount; i++) {
      // Skip images already processed
      if (i < arReadyCount) continue;

      try {
        const res = await fetch("/api/admin/products/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, imageIndex: i }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            completed++;
            setDone(completed);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed");
          break;
        }
      } catch {
        setError("Network error");
        break;
      }
    }

    setProcessing(false);
  }

  if (imageCount === 0) return null;

  return (
    <button
      onClick={handleProcess}
      disabled={processing || allDone}
      title={
        allDone
          ? `${productName}: All ${imageCount} images AR-ready`
          : error
          ? error
          : `Process ${imageCount - done} image(s) for AR`
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.4rem 0.6rem",
        background: allDone
          ? "rgba(16,185,129,0.1)"
          : error
          ? "rgba(239,68,68,0.1)"
          : "rgba(168,85,247,0.1)",
        color: allDone ? "#10b981" : error ? "#ef4444" : "#a855f7",
        border: `1px solid ${allDone ? "rgba(16,185,129,0.2)" : error ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.25)"}`,
        borderRadius: "6px",
        fontSize: "0.7rem",
        fontWeight: 600,
        cursor: processing || allDone ? "default" : "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {processing ? (
        <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
      ) : allDone ? (
        <CheckCircle size={11} />
      ) : error ? (
        <AlertCircle size={11} />
      ) : (
        <Wand2 size={11} />
      )}
      {processing
        ? `${done}/${imageCount}`
        : allDone
        ? "AR ✓"
        : `AR ${done}/${imageCount}`}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
