"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", productId);
    router.refresh();
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            padding: "0.4rem 0.6rem",
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.7rem",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          {loading ? "..." : "Yes, Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: "0.4rem 0.6rem",
            background: "none",
            color: "var(--muted)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.7rem",
            transition: "all 0.2s",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.4rem 0.75rem",
        background: "rgba(239,68,68,0.08)",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontWeight: 500,
        transition: "all 0.2s",
      }}
    >
      <Trash2 size={12} />
      Delete
    </button>
  );
}
