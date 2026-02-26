"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ViewingNowProps {
  productId: string;
}

export default function ViewingNow({ productId }: ViewingNowProps) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!productId) return;
    const supabase = createClient();
    const channel = supabase.channel(`product-${productId}`, {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  if (count < 2) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.3rem 0.7rem",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "20px",
        fontSize: "0.75rem",
        color: "#ef4444",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#ef4444",
          animation: "pulseGold 1.5s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      👀 {count} people viewing now
    </div>
  );
}
