/**
 * GET /api/admin/back-in-stock/counts
 *
 * Returns the count of pending (notified=false) back-in-stock requests
 * grouped by product_id. Used by the admin inventory page to show waitlist sizes.
 *
 * Admin-only: requires valid admin session (checked via admin gate).
 * Returns: { counts: Record<product_id, count> }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all pending (unnotified) requests grouped by product_id
    const { data, error } = await admin
      .from("back_in_stock_requests")
      .select("product_id")
      .eq("notified", false);

    if (error) throw error;

    // Aggregate counts by product_id
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.product_id] = (counts[row.product_id] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("Back-in-stock counts error:", err);
    return NextResponse.json({ counts: {} });
  }
}
