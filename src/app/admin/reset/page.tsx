"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

const KEEPS = [
  "✅ Categories (7 seeded)",
  "✅ Products & images",
  "✅ Bundles & gift sets",
  "✅ Coupons & promotions",
  "✅ Blog posts",
  "✅ Collections",
  "✅ Admin account",
];

const DELETES = [
  "🗑 All orders & order items",
  "🗑 All customer accounts",
  "🗑 User profiles & loyalty points",
  "🗑 Newsletter subscribers",
  "🗑 Back-in-stock requests",
  "🗑 Reviews",
  "🗑 Contact messages",
  "🗑 Email logs & campaigns",
  "🗑 Push subscriptions",
];

export default function AdminResetPage() {
  const [step, setStep] = useState<"idle" | "confirm" | "running" | "done">("idle");
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function runReset() {
    setStep("running");
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET_ALL_DATA" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Reset failed");
      setResults(json.results || {});
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("idle");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444" }}>
          <RefreshCw size={24} /> Reset Test Data
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Clear all transient data while keeping master/seed data intact.
        </p>
      </div>

      {/* What's affected */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Keeps */}
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#10b981", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={16} /> KEPT SAFE (Master Data)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {KEEPS.map((item) => (
              <p key={item} style={{ fontSize: "0.8rem", color: "var(--text)" }}>{item}</p>
            ))}
          </div>
        </div>

        {/* Deletes */}
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trash2 size={16} /> WILL BE DELETED
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DELETES.map((item) => (
              <p key={item} style={{ fontSize: "0.8rem", color: "var(--text)" }}>{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem", display: "flex", gap: "0.75rem" }}>
        <AlertTriangle size={20} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.875rem" }}>This action is irreversible</p>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            All deleted data cannot be recovered. Use this only for testing/demo environment resets.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem", color: "#ef4444", fontSize: "0.875rem" }}>
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {step === "done" && Object.keys(results).length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "#10b981" }}>
            ✅ Reset Complete
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.entries(results).map(([table, result]) => (
              <div key={table} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem" }}>
                {result.startsWith("✅") ? (
                  <CheckCircle size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                ) : result.startsWith("⚠️") ? (
                  <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                ) : (
                  <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                )}
                <span style={{ color: "var(--muted)", minWidth: "220px" }}>{table}</span>
                <span style={{ color: result.startsWith("✅") ? "#10b981" : result.startsWith("⚠️") ? "#f59e0b" : "#ef4444" }}>
                  {result.replace(/^[✅⚠️❌]\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      {step === "idle" && (
        <button
          onClick={() => setStep("confirm")}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.875rem 2rem", borderRadius: "10px",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
            color: "#ef4444", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
        >
          <Trash2 size={16} /> Reset All Test Data
        </button>
      )}

      {step === "confirm" && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "2px solid rgba(239,68,68,0.4)", borderRadius: "12px", padding: "1.5rem" }}>
          <p style={{ fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem", fontSize: "1rem" }}>
            ⚠ Are you absolutely sure?
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            This will delete ALL orders, customers, reviews, messages and more. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setStep("idle")}
              className="btn-gold-outline"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={runReset}
              style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: "#ef4444", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      )}

      {step === "running" && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--gold)" }} />
          <div>
            <p style={{ fontWeight: 600 }}>Resetting data…</p>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Deleting orders, users, messages…</p>
          </div>
        </div>
      )}

      {step === "done" && (
        <button
          onClick={() => { setStep("idle"); setResults({}); }}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", cursor: "pointer", fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Reset Again
        </button>
      )}
    </div>
  );
}
