import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star, ShoppingBag, ChevronRight, Gift, Zap, TrendingUp, Minus, Crown, Truck, Sparkles, Calendar } from "lucide-react";
import type { Metadata } from "next";
import {
  LOYALTY_TIERS,
  TIER_ORDER,
  getTierConfig,
  getProgressToNextTier,
  type LoyaltyTierName,
  type TierConfig,
} from "@/lib/loyalty-tiers";

export const metadata: Metadata = {
  title: "My Rewards — Krisha Sparkles",
};

export default async function PointsPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  let pointsBalance = 0;
  let lifetimePoints = 0;
  let tierName: LoyaltyTierName = "bronze";
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
      .select("points_balance, loyalty_tier, lifetime_points")
      .eq("id", user.id)
      .single();
    pointsBalance = profile?.points_balance ?? 0;
    lifetimePoints = profile?.lifetime_points ?? 0;
    tierName = (profile?.loyalty_tier || "bronze") as LoyaltyTierName;
  } catch { /* column may not exist */ }

  try {
    // Fetch all orders — points_earned is 0 until delivered, then set by status route
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, points_redeemed, points_earned")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (orders) {
      history = orders.map((o) => {
        const earned = o.points_earned || 0;   // stored by status route on delivery
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

  const tier = getTierConfig(tierName);
  const progress = getProgressToNextTier(lifetimePoints, tierName);
  const dollarValue = Math.floor(pointsBalance / tier.pointsPerDollar);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Back link */}
        <Link
          href="/account"
          style={{ color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "2rem" }}
        >
          ← Back to Account
        </Link>

        {/* ════════════════════════════════════════════════════════════
            TIER CARD — Big, beautiful, shows current tier + progress
            ════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: `linear-gradient(135deg, ${tier.bgColor} 0%, #0f0c00 50%, ${tier.bgColor} 100%)`,
            border: `2px solid ${tier.color}`,
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
            position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)",
            width: "300px", height: "300px",
            background: `radial-gradient(circle, ${tier.borderColor} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            {/* Tier icon */}
            <div style={{
              fontSize: "3.5rem",
              marginBottom: "0.75rem",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}>
              {tier.icon}
            </div>

            {/* Tier label */}
            <p style={{
              color: tier.color,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.25rem",
            }}>
              {tier.label} Member
            </p>

            {/* Points balance */}
            <p
              data-testid="points-balance"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "3.5rem",
                fontWeight: 700,
                color: tier.color,
                margin: "0 0 0.25rem",
                lineHeight: 1,
              }}
            >
              {pointsBalance.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: 0 }}>
              points available
            </p>

            {dollarValue > 0 && (
              <div style={{
                marginTop: "0.75rem",
                display: "inline-block",
                background: `${tier.bgColor}`,
                border: `1px solid ${tier.borderColor}`,
                borderRadius: "20px",
                padding: "0.35rem 0.9rem",
                fontSize: "0.8rem",
                color: tier.color,
                fontWeight: 600,
              }}>
                Worth ${dollarValue} off your next order
              </div>
            )}

            {/* Multiplier badge */}
            {tier.pointsMultiplier > 1 && (
              <div style={{
                marginTop: "0.5rem",
                display: "inline-block",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "20px",
                padding: "0.3rem 0.75rem",
                fontSize: "0.75rem",
                color: "#10b981",
                fontWeight: 600,
                marginLeft: "0.5rem",
              }}>
                ⚡ {tier.pointsMultiplier}x points earning
              </div>
            )}

            {/* Progress to next tier */}
            {progress.next && (
              <div style={{ marginTop: "1.5rem", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {progress.pointsNeeded.toLocaleString()} pts to {progress.next.icon} {progress.next.label}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: tier.color, fontWeight: 600 }}>
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                <div style={{
                  width: "100%", height: "8px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "4px", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${progress.progress}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${tier.color}, ${progress.next.color})`,
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--subtle)", marginTop: "0.35rem" }}>
                  {lifetimePoints.toLocaleString()} / {progress.next.minPoints.toLocaleString()} lifetime points
                </p>
              </div>
            )}

            {/* Diamond — max tier message */}
            {!progress.next && (
              <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: tier.color, fontStyle: "italic" }}>
                ✨ You&apos;ve reached our highest tier — thank you for your loyalty!
              </p>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            STATS ROW
            ════════════════════════════════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
            <TrendingUp size={18} style={{ color: "#10b981", margin: "0 auto 0.4rem", display: "block" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: "#10b981", margin: "0 0 0.15rem" }}>
              {totalEarned.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>Total Earned</p>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
            <Gift size={18} style={{ color: "var(--gold)", margin: "0 auto 0.4rem", display: "block" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)", margin: "0 0 0.15rem" }}>
              {totalRedeemed.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>Total Redeemed</p>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
            <Crown size={18} style={{ color: tier.color, margin: "0 auto 0.4rem", display: "block" }} />
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, color: tier.color, margin: "0 0 0.15rem" }}>
              {lifetimePoints.toLocaleString()}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>Lifetime Pts</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            YOUR BENEFITS
            ════════════════════════════════════════════════════════════ */}
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          Your {tier.label} Benefits
        </h2>

        <div style={{
          background: "var(--surface)", border: `1px solid ${tier.borderColor}`,
          borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "2rem",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <BenefitItem icon={<Zap size={16} style={{ color: "#10b981" }} />} label="Points Multiplier" value={`${tier.pointsMultiplier}x earnings`} active />
            <BenefitItem
              icon={<Truck size={16} style={{ color: "#3b82f6" }} />}
              label="Free Shipping"
              value={tier.freeShippingThreshold === null ? "Always FREE" : `On orders $${tier.freeShippingThreshold}+`}
              active
            />
            <BenefitItem icon={<Calendar size={16} style={{ color: "#f59e0b" }} />} label="Birthday Bonus" value={tier.birthdayBonus > 0 ? `${tier.birthdayBonus} pts` : "—"} active={tier.birthdayBonus > 0} />
            <BenefitItem icon={<Star size={16} style={{ color: "#a855f7" }} />} label="Redemption Rate" value={`${tier.pointsPerDollar} pts = $1`} active />
            <BenefitItem icon={<Sparkles size={16} style={{ color: "#ec4899" }} />} label="Early Access" value={tier.earlyAccess ? "Yes" : "—"} active={tier.earlyAccess} />
            <BenefitItem icon={<Crown size={16} style={{ color: "#b9f2ff" }} />} label="Exclusive Drops" value={tier.exclusiveDrops ? "Yes" : "—"} active={tier.exclusiveDrops} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            TIER COMPARISON TABLE
            ════════════════════════════════════════════════════════════ */}
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          All Tiers
        </h2>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--gold-border)",
          borderRadius: "12px", overflow: "hidden", marginBottom: "2rem",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid var(--gold-border)",
            background: "rgba(201,168,76,0.05)",
          }}>
            <span style={thStyle}>Benefit</span>
            <span style={thStyle}>Multiplier</span>
            <span style={thStyle}>Free Shipping</span>
            <span style={thStyle}>Birthday</span>
          </div>

          {TIER_ORDER.map((tn) => {
            const t = LOYALTY_TIERS[tn];
            const isCurrent = tn === tierName;
            return (
              <div
                key={tn}
                style={{
                  display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
                  padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isCurrent ? `${t.bgColor}` : "transparent",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isCurrent ? t.color : "var(--text)" }}>
                      {t.label}
                    </span>
                    {isCurrent && (
                      <span style={{
                        marginLeft: "0.4rem", fontSize: "0.6rem", fontWeight: 700,
                        padding: "1px 6px", borderRadius: "4px",
                        background: `${t.borderColor}`, color: t.color,
                      }}>
                        YOU
                      </span>
                    )}
                    <p style={{ color: "var(--subtle)", fontSize: "0.68rem", margin: 0 }}>
                      {t.minPoints > 0 ? `${t.minPoints.toLocaleString()}+ pts` : "Start here"}
                    </p>
                  </div>
                </div>
                <span style={tdStyle}>{t.pointsMultiplier}x</span>
                <span style={tdStyle}>{t.freeShippingThreshold === null ? "Always" : `$${t.freeShippingThreshold}+`}</span>
                <span style={tdStyle}>{t.birthdayBonus > 0 ? `${t.birthdayBonus} pts` : "—"}</span>
              </div>
            );
          })}
        </div>

        {/* Redemption explainer */}
        <div style={{
          background: `${tier.bgColor}`,
          border: `1px solid ${tier.borderColor}`,
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}>
          <Star size={18} style={{ color: tier.color, flexShrink: 0 }} fill={tier.color} />
          <p style={{ color: "var(--text)", fontSize: "0.875rem", margin: 0 }}>
            <strong style={{ color: tier.color }}>{tier.pointsPerDollar} points = $1 off</strong>{" "}
            — Redeem your points at checkout using the &ldquo;Loyalty Points&rdquo; toggle. Minimum {tier.pointsPerDollar} points required.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
            POINTS HISTORY TABLE
            ════════════════════════════════════════════════════════════ */}
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
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
              <span style={thStyle}>Order</span>
              <span style={{ ...thStyle, textAlign: "right", paddingRight: "1.5rem" }}>Earned</span>
              <span style={{ ...thStyle, textAlign: "right" }}>Redeemed</span>
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
                      href="/account/orders"
                      style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}
                    >
                      #{entry.order_short}
                    </Link>
                    <span style={{
                      fontSize: "0.7rem", padding: "1px 6px", borderRadius: "20px", fontWeight: 600,
                      background: entry.status === "delivered"
                        ? "rgba(16,185,129,0.12)"
                        : entry.status === "cancelled" || entry.status === "returned"
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(201,168,76,0.12)",
                      color: entry.status === "delivered"
                        ? "#10b981"
                        : entry.status === "cancelled" || entry.status === "returned"
                          ? "#ef4444"
                          : "var(--gold)",
                    }}>
                      {entry.status}
                    </span>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                    {formatDate(entry.created_at)} &bull; ${entry.order_total.toFixed(2)} order
                  </p>
                </div>

                <div style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                  {entry.points_earned > 0 ? (
                    <>
                      <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.875rem" }}>
                        +{entry.points_earned.toLocaleString()}
                      </span>
                      <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>pts earned</p>
                    </>
                  ) : entry.status === "delivered" ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>
                  ) : entry.status === "cancelled" || entry.status === "returned" ? (
                    <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>no points</span>
                  ) : (
                    <>
                      <span style={{ color: "var(--gold)", fontSize: "0.75rem", fontWeight: 600 }}>pending</span>
                      <p style={{ color: "var(--muted)", fontSize: "0.7rem", margin: 0 }}>on delivery</p>
                    </>
                  )}
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

        {/* ════════════════════════════════════════════════════════════
            HOW IT WORKS
            ════════════════════════════════════════════════════════════ */}
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          How It Works
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {[
            { icon: <ShoppingBag size={20} style={{ color: "var(--gold)" }} />, title: "Shop & Earn", desc: `Earn ${tier.pointsMultiplier > 1 ? `${tier.pointsMultiplier}x` : "1"} point${tier.pointsMultiplier > 1 ? "s" : ""} for every $1 you spend as a ${tier.label} member. Points are credited when your order is delivered.` },
            { icon: <Zap size={20} style={{ color: "var(--gold)" }} />, title: "Level Up", desc: "Your lifetime points determine your tier. Higher tiers unlock better multipliers and exclusive perks." },
            { icon: <Gift size={20} style={{ color: "var(--gold)" }} />, title: "Redeem at Checkout", desc: `Use points at checkout — ${tier.pointsPerDollar} points = $1 off your order at ${tier.label} tier.` },
          ].map((item, i) => (
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
            {tier.pointsMultiplier > 1 ? `${tier.pointsMultiplier}x points` : "1 point"} earned for every $1 spent &bull; {tier.pointsPerDollar} points = $1 off
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

/* ─── Helper Components ─── */

const thStyle: React.CSSProperties = {
  fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em",
};
const tdStyle: React.CSSProperties = {
  fontSize: "0.82rem", color: "var(--text)", fontWeight: 500,
};

function BenefitItem({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      opacity: active ? 1 : 0.35,
    }}>
      {icon}
      <div>
        <p style={{ fontSize: "0.78rem", fontWeight: 600, margin: 0, color: active ? "var(--text)" : "var(--subtle)" }}>{label}</p>
        <p style={{ fontSize: "0.72rem", margin: 0, color: active ? "var(--muted)" : "var(--subtle)" }}>{value}</p>
      </div>
    </div>
  );
}
