"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Purchase {
  product_name: string;
  buyer_city: string;
  minutes_ago: number;
}

export default function SocialProofToast() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.resolve(
      supabase.rpc("get_recent_purchases")
    ).then(({ data }) => {
      if (data && data.length > 0) {
        setPurchases(data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (purchases.length === 0) return;

    // Start first toast after 5s delay
    const startTimer = setTimeout(() => {
      setVisible(true);
    }, 5000);

    return () => clearTimeout(startTimer);
  }, [purchases]);

  useEffect(() => {
    if (!visible || purchases.length === 0) return;

    // Show for 5s, hide for 8s, then next
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % purchases.length);
        setVisible(true);
      }, 8000);
    }, 5000);

    return () => clearTimeout(hideTimer);
  }, [visible, currentIndex, purchases.length]);

  if (purchases.length === 0 || !visible) return null;

  const p = purchases[currentIndex];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "5rem",
        left: "1.25rem",
        zIndex: 55,
        background: "var(--surface)",
        border: "1px solid var(--gold-border)",
        borderRadius: "12px",
        padding: "0.85rem 1.1rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        maxWidth: "280px",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        animation: "slideUp 0.35s ease",
      }}
    >
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🛍️</span>
      <div>
        <p style={{ fontSize: "0.78rem", color: "var(--text)", margin: "0 0 2px", fontWeight: 600, lineHeight: 1.3 }}>
          {p.buyer_city || "Someone"} just bought
        </p>
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--gold)",
            margin: 0,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "190px",
          }}
        >
          {p.product_name}
        </p>
        <p style={{ fontSize: "0.68rem", color: "var(--subtle)", margin: "2px 0 0" }}>
          {p.minutes_ago < 2 ? "just now" : `${p.minutes_ago} min ago`}
        </p>
      </div>
    </div>
  );
}
