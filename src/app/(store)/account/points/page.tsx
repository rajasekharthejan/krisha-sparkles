import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Star, ShoppingBag, ChevronRight, Gift, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Points",
};

export default async function PointsPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  let pointsBalance = 0;
  let totalOrders = 0;

  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single();
    pointsBalance = profile?.points_balance ?? 0;
  } catch { /* column may not exist */ }

  try {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "paid");
    totalOrders = count ?? 0;
  } catch { /* orders table may not have user_id yet */ }

  const HOW_TO_EARN = [
    { icon: <ShoppingBag size={20} style={{ color: "var(--gold)" }} />, title: "Shop & Earn", desc: "Earn 1 point for every $1 you spend on any order." },
    { icon: <Zap size={20} style={{ color: "var(--gold)" }} />, title: "Automatic", desc: "Points are added automatically after payment is confirmed." },
    { icon: <Gift size={20} style={{ color: "var(--gold)" }} />, title: "Redeem Soon", desc: "Redemption & exclusive rewards are coming soon. Keep shopping!" },
  ];

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
            marginBottom: "2rem",
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

            {totalOrders > 0 && (
              <p style={{
                marginTop: "1.25rem",
                color: "var(--muted)",
                fontSize: "0.8rem",
              }}>
                Earned across{" "}
                <span style={{ color: "var(--text)" }}>{totalOrders} order{totalOrders !== 1 ? "s" : ""}</span>
              </p>
            )}
          </div>
        </div>

        {/* Redemption coming-soon pill */}
        <div style={{
          background: "rgba(201,168,76,0.07)",
          border: "1px dashed rgba(201,168,76,0.35)",
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}>
          <Gift size={18} style={{ color: "var(--gold)", flexShrink: 0 }} />
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            <strong style={{ color: "var(--text)" }}>Redemption coming soon!</strong>{" "}
            We&apos;re building rewards so you can spend your points on discounts and exclusive gifts.
          </p>
        </div>

        {/* How to Earn */}
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.25rem",
          fontWeight: 700,
          marginBottom: "1rem",
        }}>
          How to Earn Points
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
            1 point earned for every $1 spent
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
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>See orders where you earned points</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
        </div>

      </div>
    </div>
  );
}
