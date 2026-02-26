import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star, ShoppingBag, ChevronRight, Gift, Zap, TrendingUp, Minus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Points — Krisha Sparkles",
};

export default async function PointsPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  let pointsBalance = 0;
  let history: Array<{
    order_id: string;
    order_short: string;
    points_earned: number;
    points_redeemed: number;
    order_total: number;
    status: string;
    created_at: string;
  }> = [];
  let totalEarned = 0;
  let totalRedeemed = 0;

  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single();
    pointsBalance = profile?.points_balance ?? 0;
  } catch { /* column may not exist */ }

  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, points_redeemed")
      .eq("user_id", user.id)
      .in("status", ["paid", "shipped", "delivered"])
      .order("created_at", { ascending: false });

    if (orders) {
      history = orders.map((o) => {
        const earned = Math.floor(o.total);
        const redeemed = o.points_redeemed || 0;
        totalEarned += earned;
        totalRedeemed += redeemed;
        return {
          order_id: o.id,
          order_short: o.id.slice(-8).toUpperCase(),
          points_earned: earned,
          points_redeemed: redeemed,
          order_total: o.total,
          status: o.status,
          created_at: o.created_at,
        };
      });
    }
  } catch { /* orders table may not have user_id */ }

  const HOW_TO_EARN = [
    { icon: <ShoppingBag size={20} style={{ color: "var(--gold)" }} />, title: "Shop & Earn", desc: "Earn 1 point for every $1 you spend on any order." },
    { icon: <Zap size={20} style={{ color: "var(--gold)" }} />, title: "Auto-Awarded", desc: "Points are added automatically after payment is confirmed." },
    { icon: <Gift size={20} style={{ color: "var(--gold)" }} />, title: "Redeem at Checkout", desc: "Use points at checkout — 100 points = $1 off your order." },
  ];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  const dollarValue = Math.floor(pointsBalance / 100);

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Back link */}
        <Link
          href="/account"
          style={{ color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "2rem" }}
        >
          ← Back to Account
        </Link>

        {/* Hero points card */}
        <div
          style={{
            background: "linear-gradient(135deg, #1a1400 0%, #0f0c00 60%, #1a1400 100%)",
            border: "1px solid var(--gold)",
            borderRadius: "20px",
            padding: "2.5rem",
            textAlign: "center",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative glow */}
          <div style={{
            position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
            width: "200px", height: "200px",
            background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "rgba(201,168,76,0.12)", border: "2px solid var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <Star size={32} style={{ color: "var(--gold)" }} fill="#c9a84c" />
            </div>

            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Your Points Balance
            </p>
            <p style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "4rem",
              fontWeight: 700,
              color: "var(--gold)",
              margin: "0 0 0.25rem",
              lineHeight: 1,
            }}>
              {pointsBalance.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: 0 }}>
              pts
            </p>

            {dollarValue > 0 && (
              <div style={{
                marginTop: "1rem",
                display: "inline-block",
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "20px",
                padding: "0.35rem 0.9rem",
                fontSize: "0.8rem",
                color: "var(--gold)",
                fontWeight: 600,
              }}>
                Worth ${dollarValue} off your next order
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <TrendingUp size={20} style={{ color: "#10b981", margin: "0 auto 0.5rem", display: "block" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "#10b981", margin: "0 0 0.2rem" }}>
              {totalEarned.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Total Earned</p>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
            <Gift size={20} style={{ color: "var(--gold)", margin: "0 auto 0.5rem", display: "block" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", margin: "0 0 0.2rem" }}>
              {totalRedeemed.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>Total Redeemed</p>
          </div>
        </div>

        {/* Redemption explainer */}
        <div style={{
          background: "rgba(201,168,76,0.07)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}>
          <Star size={18} style={{ color: "var(--gold)", flexShrink: 0 }} fill="#c9a84c" />
          <p style={{ color: "var(--text)", fontSize: "0.875rem", margin: 0 }}>
            <strong style={{ color: "var(--gold)" }}>100 points = $1 off</strong>{" "}
            — Redeem your points at checkout using the &ldquo;Loyalty Points&rdquo; toggle. Minimum 100 points required.
          </p>
        </div>

        {/* Points History Table */}
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.25rem",
          fontWeight: 700,
          marginBottom: "1rem",
        }}>
          Points History
        </h2>

        {history.length === 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px",
            padding: "3rem", textAlign: "center", marginBottom: "2rem",
          }}>
            <Star size={40} style={{ color: "var(--subtle)", margin: "0 auto 1rem", display: "block" }} strokeWidth={1} />
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
              No points earned yet. Place your first order to start earning!
            </p>
          </div>
        ) : (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--gold-border)",
            borderRadius: "12px", overflow: "hidden", marginBottom: "2rem",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid var(--gold-border)",
              background: "rgba(201,168,76,0.05)",
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Order</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right", paddingRight: "1.5rem" }}>Earned</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Redeemed</span>
            </div>

            {history.map((entry, i) => (
              <div
                key={entry.order_id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  padding: "1rem 1.25rem",
                  borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <Link
                      href={`/account/orders`}
                      style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}
                    >
                      #{entry.order_short}
                    </Link>
                    <span style={{
                      fontSize: "0.7rem", padding: "1px 6px", borderRadius: "20px", fontWeight: 600,
                      background: entry.status === "delivered" ? "rgba(16,185,129,0.12)" : "rgba(201,168,76,0.12)",
                      color: entry.status === "delivered" ? "#10b981" : "var(--gold)",
                    }}>
                      {entry.status}
                    </span>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                    {formatDate(entry.created_at)} &bull; ${entry.order_total.toFixed(2)} order
                  </p>
                </div>

                <div style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.875rem" }}>
                    +{entry.points_earned.toLocaleString()}
                  </span>
                  <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>pts</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  {entry.points_redeemed > 0 ? (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--gold)", fontWeight: 700, fontSize: "0.875rem", justifyContent: "flex-end" }}>
                        <Minus size={10} />
                        {entry.points_redeemed.toLocaleString()}
                      </span>
                      <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>redeemed</p>
                    </>
                  ) : (
                    <span style={{ color: "var(--subtle)", fontSize: "0.875rem" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How to Earn */}
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.25rem",
          fontWeight: 700,
          marginBottom: "1rem",
        }}>
          How It Works
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {HOW_TO_EARN.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "1.25rem 1.5rem",
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                borderRadius: "12px",
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(201,168,76,0.1)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.2rem" }}>{item.title}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/shop" className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={16} />
            Shop &amp; Earn Points
          </Link>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.75rem" }}>
            1 point earned for every $1 spent &bull; 100 points = $1 off
          </p>
        </div>

        {/* Quick nav */}
        <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--gold-border)" }}>
          <Link
            href="/account/orders"
            className="gold-hover-card"
            style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1.25rem 1.5rem",
              background: "var(--surface)", border: "1px solid var(--gold-border)",
              borderRadius: "12px", textDecoration: "none",
            }}
          >
            <ShoppingBag size={20} style={{ color: "var(--gold)" }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>View My Orders</p>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>See all orders where you earned points</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
        </div>

      </div>
    </div>
  );
}
