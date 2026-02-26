/**
 * POST /api/loyalty/redeem
 *
 * Validates a loyalty points redemption request before checkout.
 * Does NOT deduct points — deduction happens in the Stripe webhook
 * after confirmed payment to prevent fraud.
 *
 * Points math: 100 points = $1 discount (POINTS_PER_DOLLAR = 100)
 * Minimum redemption: 100 points ($1 off)
 * Points must be redeemed in multiples of 100 (whole dollars only)
 *
 * Body: { points_to_redeem: number }
 * Returns: { valid: boolean, points_to_redeem: number, discount_amount: number, remaining_balance: number }
 * Errors: 401 (not logged in), 400 (invalid points), 422 (insufficient balance)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const POINTS_PER_DOLLAR = 100; // 100 loyalty points = $1 discount
const MIN_REDEEM_POINTS = 100; // minimum 100 points ($1) to redeem

export async function POST(req: NextRequest) {
  try {
    // Auth guard — must be logged in to redeem points
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

    const body = await req.json();
    const requestedPoints: number = Number(body.points_to_redeem) || 0;

    // Validate: must be a positive multiple of MIN_REDEEM_POINTS
    if (
      !requestedPoints ||
      requestedPoints < MIN_REDEEM_POINTS ||
      requestedPoints % MIN_REDEEM_POINTS !== 0
    ) {
      return NextResponse.json(
        {
          error: `Points must be a multiple of ${MIN_REDEEM_POINTS} (minimum ${MIN_REDEEM_POINTS} points = $${MIN_REDEEM_POINTS / POINTS_PER_DOLLAR})`,
        },
        { status: 400 }
      );
    }

    // Fetch current points balance from user_profiles using admin client
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Could not retrieve points balance" },
        { status: 500 }
      );
    }

    const currentBalance: number = profile.points_balance || 0;

    // Validate: must have enough points
    if (requestedPoints > currentBalance) {
      return NextResponse.json(
        {
          error: `Insufficient points balance. You have ${currentBalance} points ($${(currentBalance / POINTS_PER_DOLLAR).toFixed(2)}).`,
          current_balance: currentBalance,
        },
        { status: 422 }
      );
    }

    // Calculate discount amount (floor to 2 decimal places)
    const discountAmount = Math.floor((requestedPoints / POINTS_PER_DOLLAR) * 100) / 100;
    const remainingBalance = currentBalance - requestedPoints;

    return NextResponse.json({
      valid: true,
      points_to_redeem: requestedPoints,
      discount_amount: discountAmount,
      remaining_balance: remainingBalance,
      current_balance: currentBalance,
    });
  } catch (err) {
    console.error("Loyalty redeem validation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
