"use client";

/**
 * /admin/newsletter — Email Marketing Campaign Manager
 *
 * Features:
 * - Subscriber list with active/inactive toggle + pagination
 * - Stats: total, active, unsubscribed, campaigns sent
 * - New Campaign compose modal (subject, preview text, HTML body, segment)
 * - Campaign history table (sent_at, subject, recipients, segment)
 * - Welcome drip status banner
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Mail, Users, Send, X, ChevronLeft, ChevronRight,
  PlusCircle, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import type { NewsletterSubscriber, EmailCampaign } from "@/types";

const SEGMENT_LABELS: Record<string, string> = {
  all: "All Subscribers",
  buyers: "Buyers Only",
  "non-buyers": "Non-buyers Only",
};

export default function EmailMarketingPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [totalSubs, setTotalSubs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">("subscribers");

  // Compose form state
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(50);
    setCampaigns((data as EmailCampaign[]) || []);
  }, []);

  const fetchSubscribers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?page=${p}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setTotalSubs(data.total ?? 0);
        setTotalPages(data.pages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(1);
    fetchCampaigns();
  }, [fetchSubscribers, fetchCampaigns]);

  async function handleToggleActive(sub: NewsletterSubscriber) {
    setToggling(sub.id);
    try {
      await fetch("/api/admin/newsletter/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, active: !sub.active }),
      });
      setSubscribers((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s))
      );
    } finally {
      setToggling(null);
    }
  }

  async function handleSendCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !htmlBody.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ subject, preview_text: previewText, html_body: htmlBody, segment }),
      });
      const result = await res.json();
      if (res.ok) {
        setSendResult({ success: true, message: result.message });
        setSubject(""); setPreviewText(""); setHtmlBody(""); setSegment("all");
        await fetchCampaigns();
        setTimeout(() => setShowCompose(false), 2500);
      } else {
        setSendResult({ success: false, message: result.error || "Send failed" });
      }
    } catch {
      setSendResult({ success: false, message: "Network error — please try again" });
    } finally {
      setSending(false);
    }
  }

  const activeCount = subscribers.filter((s) => s.active).length;

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={22} style={{ color: "var(--gold)" }} /> Email Marketing
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage subscribers · Send campaigns · Welcome drip active
          </p>
        </div>
        <button
          onClick={() => { setShowCompose(true); setSendResult(null); }}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.65rem 1.25rem",
            background: "linear-gradient(135deg,#c9a84c,#e8c96a)",
            color: "#0a0a0a", border: "none", borderRadius: "8px",
            fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
          }}
        >
          <PlusCircle size={16} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Subscribers", value: totalSubs, color: "var(--gold)", icon: <Users size={18} /> },
          { label: "Active", value: activeCount, color: "#10b981", icon: <CheckCircle size={18} /> },
          { label: "Unsubscribed", value: totalSubs - activeCount, color: "#ef4444", icon: <X size={18} /> },
          { label: "Campaigns Sent", value: campaigns.length, color: "#6366f1", icon: <Send size={18} /> },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: stat.color, marginBottom: "0.4rem" }}>
              {stat.icon}
              <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: stat.color, fontFamily: "var(--font-playfair)", margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Drip Banner */}
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px", padding: "0.9rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Clock size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
        <p style={{ color: "#aaa", fontSize: "0.8rem", margin: 0 }}>
          <strong style={{ color: "#f5f5f5" }}>Welcome Drip Active:</strong>{" "}
          Day 0 — welcome + WELCOME10 &nbsp;·&nbsp; Day 3 — best sellers &nbsp;·&nbsp; Day 7 — refer-a-friend
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--gold-border)" }}>
        {(["subscribers", "campaigns"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.6rem 1.25rem", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "var(--gold)" : "transparent"}`,
              color: activeTab === tab ? "var(--gold)" : "var(--muted)",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer", fontSize: "0.875rem", textTransform: "capitalize",
              transition: "all 0.2s",
            }}
          >
            {tab === "subscribers"
              ? `Subscribers (${totalSubs})`
              : `Campaign History (${campaigns.length})`}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading…</div>
          ) : subscribers.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
              <Users size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} strokeWidth={1} />
              <p>No subscribers yet.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Subscribed</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 500, fontSize: "0.875rem" }}>{sub.email}</td>
                        <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{sub.name || "—"}</td>
                        <td>
                          <span style={{
                            padding: "0.2rem 0.6rem", borderRadius: "9999px",
                            fontSize: "0.7rem", fontWeight: 600,
                            background: sub.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: sub.active ? "#10b981" : "#ef4444",
                          }}>
                            {sub.active ? "Active" : "Unsubscribed"}
                          </span>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          {new Date(sub.subscribed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(sub)}
                            disabled={toggling === sub.id}
                            style={{
                              padding: "0.3rem 0.75rem", fontSize: "0.7rem", fontWeight: 600,
                              border: "1px solid var(--gold-border)", borderRadius: "6px",
                              background: "transparent", cursor: "pointer",
                              color: sub.active ? "#ef4444" : "#10b981",
                              opacity: toggling === sub.id ? 0.5 : 1,
                            }}
                          >
                            {toggling === sub.id ? "…" : sub.active ? "Deactivate" : "Reactivate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--gold-border)", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    disabled={page === 1}
                    onClick={() => { const p = page - 1; setPage(p); fetchSubscribers(p); }}
                    style={{ background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.35rem 0.6rem", cursor: "pointer", color: "var(--muted)", opacity: page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => { const p = page + 1; setPage(p); fetchSubscribers(p); }}
                    style={{ background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.35rem 0.6rem", cursor: "pointer", color: "var(--muted)", opacity: page === totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
          {campaigns.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
              <Send size={40} style={{ opacity: 0.3, margin: "0 auto 1rem" }} strokeWidth={1} />
              <p>No campaigns sent yet.</p>
              <button
                onClick={() => setShowCompose(true)}
                style={{ marginTop: "1rem", padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", color: "#0a0a0a", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Send Your First Campaign
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Segment</th>
                    <th>Recipients</th>
                    <th>Sent At</th>
                    <th>Sent By</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((camp) => (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 500, fontSize: "0.875rem", maxWidth: "280px" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{camp.subject}</div>
                        {camp.preview_text && (
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {camp.preview_text}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "var(--gold-muted)", color: "var(--gold)", whiteSpace: "nowrap" }}>
                          {SEGMENT_LABELS[camp.segment] || camp.segment}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--gold)" }}>{camp.recipient_count}</td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {new Date(camp.sent_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{camp.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Compose Modal ─────────────────────────────────────────────────── */}
      {showCompose && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompose(false); }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "14px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--gold)" }}>
                New Campaign
              </h2>
              <button onClick={() => setShowCompose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCampaign} style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject Line *</label>
                  <input className="input-dark" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New arrivals just dropped! ✨" required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Preview Text <span style={{ fontWeight: 400, textTransform: "none", fontSize: "0.75rem" }}>(shown in inbox preview)</span>
                  </label>
                  <input className="input-dark" type="text" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Shop our newest collection before it sells out…" style={{ width: "100%", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Send To</label>
                  <select className="input-dark" value={segment} onChange={(e) => setSegment(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                    <option value="all">All Subscribers</option>
                    <option value="buyers">Buyers Only (placed an order)</option>
                    <option value="non-buyers">Non-buyers (subscribed but never ordered)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Body (HTML) *</label>
                  <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: "0 0 0.5rem" }}>
                    Write just the main content — Krisha Sparkles header + footer + unsubscribe link are added automatically.
                  </p>
                  <textarea
                    className="input-dark"
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    placeholder={`<div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">\n  <h1 style="color:#c9a84c;font-size:22px;">New Arrivals Are Here! 🌟</h1>\n  <p style="color:#aaa;font-size:14px;">Discover our stunning new collection…</p>\n  <a href="https://krisha-sparkles.vercel.app/shop" style="display:inline-block;background:#c9a84c;color:#0a0a0a;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;">Shop Now →</a>\n</div>`}
                    required
                    rows={12}
                    style={{ width: "100%", boxSizing: "border-box", fontFamily: "monospace", fontSize: "0.78rem", resize: "vertical" }}
                  />
                </div>

                {sendResult && (
                  <div style={{ padding: "0.9rem 1.1rem", borderRadius: "8px", background: sendResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${sendResult.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {sendResult.success
                      ? <CheckCircle size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                      : <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />}
                    <span style={{ fontSize: "0.875rem", color: sendResult.success ? "#10b981" : "#ef4444" }}>{sendResult.message}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    style={{ padding: "0.65rem 1.25rem", background: "none", border: "1px solid var(--gold-border)", borderRadius: "8px", color: "var(--muted)", cursor: "pointer", fontSize: "0.875rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !subject.trim() || !htmlBody.trim()}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.5rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", color: "#0a0a0a", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", opacity: (sending || !subject.trim() || !htmlBody.trim()) ? 0.6 : 1 }}
                  >
                    <Send size={15} />
                    {sending ? "Sending…" : "Send Campaign"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
