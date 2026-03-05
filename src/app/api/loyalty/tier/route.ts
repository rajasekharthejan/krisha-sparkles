/**
 * GET /api/loyalty/tier
 *
 * Returns the authenticated user's loyalty tier info including:
 * - Current tier name + config (benefits, multiplier, etc.)
 * - Lifetime points
 * - Progress toward next tier
 * - Points balance (redeemable)
 *
 * Auth required — returns 401 for unauthenticated requests.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  getTierConfig,
  getProgressToNextTier,
  type LoyaltyTierName,
} from "@/lib/loyalty-tiers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from("user_profiles")
      .select("points_balance, loyalty_tier, lifetime_points, birthday, tier_upgraded_at")
      .eq("id", user.id)
      .single();

    const tierName = (profile?.loyalty_tier || "bronze") as LoyaltyTierName;
    const lifetimePoints = profile?.lifetime_points || 0;
    const pointsBalance = profile?.points_balance || 0;
    const tier = getTierConfig(tierName);
    const progress = getProgressToNextTier(lifetimePoints, tierName);

    return NextResponse.json({
      tier: {
        name: tier.name,
        label: tier.label,
        color: tier.color,
        bgColor: tier.bgColor,
        borderColor: tier.borderColor,
        icon: tier.icon,
        pointsMultiplier: tier.pointsMultiplier,
        freeShippingThreshold: tier.freeShippingThreshold,
        birthdayBonus: tier.birthdayBonus,
        earlyAccess: tier.earlyAccess,
        exclusiveDrops: tier.exclusiveDrops,
        pointsPerDollar: tier.pointsPerDollar,
      },
      lifetime_points: lifetimePoints,
      points_balance: pointsBalance,
      birthday: profile?.birthday || null,
      tier_upgraded_at: profile?.tier_upgraded_at || null,
      next_tier: progress.next
        ? {
            name: progress.next.name,
            label: progress.next.label,
            color: progress.next.color,
            icon: progress.next.icon,
            minPoints: progress.next.minPoints,
            pointsNeeded: progress.pointsNeeded,
            progress: Math.round(progress.progress),
          }
        : null,
    });
  } catch (err) {
    console.error("Loyalty tier error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
