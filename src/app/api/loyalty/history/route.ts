/**
 * GET /api/loyalty/history
 *
 * Returns the authenticated user's loyalty points earning history,
 * derived from their paid orders. Each paid order earns 1 point per $1
 * spent (Math.floor of order total).
 *
 * Also returns the current points balance from user_profiles.
 *
 * Auth required — returns 401 for unauthenticated requests.
 *
 * Returns:
 * {
 *   history: PointsHistory[],   // most recent first
 *   current_balance: number,    // live from user_profiles.points_balance
 *   points_per_dollar: number,  // always 100 (100 pts = $1)
 * }
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

    // Fetch paid/shipped/delivered orders for points history
    // Points earned = Math.floor(order.total) per order (1pt per $1)
    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id, total, status, created_at, points_redeemed")
      .eq("user_id", user.id)
      .in("status", ["paid", "shipped", "delivered"])
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Failed to fetch orders for points history:", ordersError);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    // Fetch current balance + tier info from user_profiles
    const { data: profile } = await admin
      .from("user_profiles")
      .select("points_balance, loyalty_tier, lifetime_points")
      .eq("id", user.id)
      .single();

    const currentBalance: number = profile?.points_balance || 0;

    // Map orders to points history entries
    const history = (orders || []).map((order) => ({
      order_id: order.id,
      order_short: order.id.slice(-8).toUpperCase(),
      points_earned: Math.floor(order.total),
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
