"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function TestModeBanner() {
  const [mode, setMode] = useState<"test" | "live" | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/mode")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.mode) setMode(data.mode); })
      .catch(() => {});
  }, []);

  if (!mode) return null;

  if (mode === "test") {
    return (
      <div
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))",
          borderBottom: "1px solid rgba(245,158,11,0.3)",
          padding: "0.5rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#f59e0b",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={14} />
        <span>TEST MODE</span>
        <span style={{ fontWeight: 400, color: "rgba(245,158,11,0.8)" }}>
          — Stripe &amp; Shippo are using test credentials. No real payments will be processed.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(16,185,129,0.06)",
        borderBottom: "1px solid rgba(16,185,129,0.15)",
        padding: "0.35rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#10b981",
        flexShrink: 0,
      }}
    >
      <ShieldCheck size={12} />
      LIVE MODE
    </div>
  );
}
