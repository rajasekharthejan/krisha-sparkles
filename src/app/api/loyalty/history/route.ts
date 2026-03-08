/**
 * GET /api/loyalty/history
 *
 * Returns the authenticated user's loyalty points history.
 *
 * Points are now earned ONLY when an order reaches "delivered" status.
 * The exact points awarded are stored in orders.points_earned (with tier
 * multiplier applied). Non-delivered orders show 0 earned but are included
 * so customers can see "pending delivery" orders in their history.
 *
 * Auth required — returns 401 for unauthenticated requests.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const POINTS_PER_DOLLAR = 100;

export async function GET() {
  try {
    // Auth guard
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

    // Try with points_earned column first; fall back without it if migration not applied yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orders: any[] | null = null;
    let hasPointsEarnedCol = false;

    const { data: ordersWithPts, error: ptsErr } = await admin
      .from("orders")
      .select("id, total, status, created_at, points_redeemed, points_earned")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!ptsErr) {
      orders = ordersWithPts;
      hasPointsEarnedCol = true;
    } else {
      const { data: ordersBase, error: baseErr } = await admin
        .from("orders")
        .select("id, total, status, created_at, points_redeemed")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (baseErr) {
        console.error("Failed to fetch orders for points history:", baseErr);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
      }
      orders = ordersBase;
    }

    // Fetch current balance + tier info from user_profiles
    const { data: profile } = await admin
      .from("user_profiles")
      .select("points_balance, loyalty_tier, lifetime_points")
      .eq("id", user.id)
      .single();

    const currentBalance: number = profile?.points_balance || 0;

    // Map orders to points history entries.
    // If column exists: use stored DB value (0 until delivered, then tier-multiplied pts).
    // If column missing (pre-migration): fall back to delivered-only calculation.
    const history = (orders || []).map((order) => ({
      order_id: order.id,
      order_short: order.id.slice(-8).toUpperCase(),
      points_earned: hasPointsEarnedCol
        ? (order.points_earned || 0)
        : (order.status === "delivered" ? Math.floor(order.total) : 0),
      points_redeemed: order.points_redeemed || 0,
      order_total: order.total,
      status: order.status,
      created_at: order.created_at,
    }));

    return NextResponse.json({
      history,
      current_balance: currentBalance,
      points_per_dollar: POINTS_PER_DOLLAR,
      loyalty_tier: profile?.loyalty_tier || "bronze",
      lifetime_points: profile?.lifetime_points || 0,
    });
  } catch (err) {
    console.error("Loyalty history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
