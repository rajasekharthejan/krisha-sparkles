"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ContactMessage } from "@/types";

interface MessagesTableProps {
  initialMessages: ContactMessage[];
}

const SUBJECT_LABELS: Record<string, string> = {
  order_issue: "Order Issue",
  return_request: "Return Request",
  product_question: "Product Question",
  general: "General",
  other: "Other",
};

export default function MessagesTable({ initialMessages }: MessagesTableProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markRead(id: string, read: boolean) {
    setLoadingId(id);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read } : m));
    setLoadingId(null);
  }

  if (messages.length === 0) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📬</p>
        <p>No messages yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            borderBottom: "1px solid var(--gold-border)",
            padding: "1.25rem 1.5rem",
            background: !msg.read ? "rgba(201,168,76,0.03)" : "transparent",
            transition: "background 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                {!msg.read && (
                  <span className="unread-dot" />
                )}
                <p style={{ fontWeight: msg.read ? 400 : 600, fontSize: "0.9rem", margin: 0 }}>{msg.name}</p>
                <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{msg.email}</span>
                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 600, background: "var(--gold-muted)", color: "var(--gold)" }}>
                  {SUBJECT_LABELS[msg.subject] || msg.subject}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--subtle)" }}>
                  {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              {expanded === msg.id ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.7, margin: "0.5rem 0 0", whiteSpace: "pre-wrap" }}>{msg.message}</p>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0.25rem 0 0" }}>
                  {msg.message}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
              <button
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                style={{ padding: "0.35rem", background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-border)"; }}
                title={expanded === msg.id ? "Collapse" : "Expand"}
              >
                {expanded === msg.id ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => markRead(msg.id, !msg.read)}
                disabled={loadingId === msg.id}
                style={{
                  padding: "0.35rem 0.6rem", background: msg.read ? "none" : "rgba(16,185,129,0.08)",
                  border: `1px solid ${msg.read ? "var(--gold-border)" : "rgba(16,185,129,0.3)"}`,
                  borderRadius: "6px", cursor: "pointer",
                  color: msg.read ? "var(--muted)" : "#10b981",
                  fontSize: "0.7rem", fontWeight: 600, transition: "all 0.2s",
                }}
              >
                {msg.read ? "Mark Unread" : "Mark Read"}
              </button>
              <a
                href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                style={{
                  padding: "0.35rem 0.6rem", background: "var(--gold-muted)",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "6px", cursor: "pointer",
                  color: "var(--gold)", fontSize: "0.7rem", fontWeight: 600,
                  textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold-muted)")}
              >
                Reply
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
