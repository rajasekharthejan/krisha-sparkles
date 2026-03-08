"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface LiveViewerCountProps {
  eventId: string;
}

export default function LiveViewerCount({ eventId }: LiveViewerCountProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channelName = `live-viewers-${eventId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "rgba(201, 168, 76, 0.15)",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text, #f5f5f5)",
  };

  const iconStyle: React.CSSProperties = {
    color: "var(--gold, #c9a84c)",
  };

  const countStyle: React.CSSProperties = {
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={badgeStyle}>
      <Eye size={16} style={iconStyle} />
      <span style={countStyle}>
        {viewerCount} watching
      </span>
    </div>
  );
}
