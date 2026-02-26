"use client";
import { useState } from "react";
import { Copy, Check, Gift, Users, DollarSign, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Referral { id: string; coupon_code: string; status: string; referee_email: string; referrer_reward_credit: number; created_at: string; completed_at: string | null; }
interface Credit { id: string; amount: number; reason: string; used: boolean; created_at: string; }

interface Props {
  initialCode: string | null;
  referrals: Referral[];
  credits: Credit[];
  availableCredit: number;
  siteUrl: string;
}

export default function ReferralDashboard({ initialCode, referrals, credits, availableCredit, siteUrl }: Props) {
  const [code, setCode] = useState(initialCode);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = code ? `${siteUrl}/ref/${code}` : null;

  async function generateCode() {
    setGenerating(true);
    try {
      const res = await fetch("/api/referrals/generate", { method: "POST" });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch {}
    setGenerating(false);
  }

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const completedCount = referrals.filter(r => r.status === "completed").length;

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Gift size={28} style={{ color: "var(--gold)" }} />
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            Refer a Friend
          </h1>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Share your unique link. When a friend makes their first purchase, you earn <strong style={{ color: "var(--gold)" }}>$5 store credit</strong>!
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { icon: <Users size={20} style={{ color: "var(--gold)" }} />, label: "Total Referrals", value: referrals.length },
          { icon: <Check size={20} style={{ color: "#10b981" }} />, label: "Completed", value: completedCount },
          { icon: <DollarSign size={20} style={{ color: "var(--gold)" }} />, label: "Available Credit", value: formatPrice(availableCredit) },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {stat.icon}
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</span>
            </div>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Your Referral Link
        </h2>
        {referralLink ? (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px", background: "var(--elevated)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.85rem", fontFamily: "monospace", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {referralLink}
            </div>
            <button onClick={copyLink} className="btn-gold" style={{ flexShrink: 0, gap: "0.4rem" }}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent("Shop Krisha Sparkles with my referral link and get a discount! " + referralLink)}`} target="_blank" rel="noopener noreferrer" className="btn-gold-outline" style={{ flexShrink: 0, gap: "0.4rem", display: "inline-flex", alignItems: "center" }}>
              <ExternalLink size={14} /> Share on WhatsApp
            </a>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--muted)", marginBottom: "1rem", fontSize: "0.875rem" }}>
              Generate your unique referral link to start earning rewards.
            </p>
            <button onClick={generateCode} disabled={generating} className="btn-gold">
              {generating ? "Generating..." : "Generate My Referral Link"}
            </button>
          </div>
        )}
      </div>

      {/* Credits */}
      {credits.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Store Credits
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {credits.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--elevated)", borderRadius: "8px" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>{c.reason}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, color: c.used ? "var(--muted)" : "#10b981", margin: 0 }}>{c.used ? "Used" : `+${formatPrice(c.amount)}`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals List */}
      {referrals.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Your Referrals
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {referrals.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--elevated)", borderRadius: "8px" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 600, margin: 0 }}>{r.coupon_code}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: r.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: r.status === "completed" ? "#10b981" : "#f59e0b", textTransform: "capitalize" }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
