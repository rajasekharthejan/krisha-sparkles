/**
 * GET /api/cron/tracking-sync
 * Runs every 2 hours (configured in vercel.json).
 * For every order with status="shipped" that has a tracking_number,
 * queries the Shippo tracking API and auto-advances status:
 *   TRANSIT        → stays "shipped"  (already correct)
 *   DELIVERED      → "delivered"      (updates DB + logs delivered_at)
 *   RETURNED       → "cancelled"      (rare edge case)
 *
 * Auth: Bearer CRON_SECRET header (Vercel sets this automatically).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTrackingStatus, detectCarrier } from "@/lib/shippo";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all shipped orders that still need tracking (last 60 days)
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, email, name, tracking_number, tracking_url, shipped_at")
    .eq("status", "shipped")
    .not("tracking_number", "is", null)
    .gte("shipped_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("[tracking-sync] DB fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: "No shipped orders to check", checked: 0 });
  }

  let delivered = 0;
  let checked   = 0;
  const errors: string[] = [];

  for (const order of orders) {
    try {
      const carrier = detectCarrier(order.tracking_url || "");
      const status  = await getTrackingStatus(carrier, order.tracking_number);

      checked++;

      if (status.status === "DELIVERED") {
        const { error: updateErr } = await supabaseAdmin
          .from("orders")
          .update({
            status:       "delivered",
            delivered_at: status.status_date || new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateErr) {
          errors.push(`Order ${order.id}: ${updateErr.message}`);
        } else {
          delivered++;
          console.log(`[tracking-sync] Marked delivered: ${order.id} (${order.tracking_number})`);
        }
      } else if (status.status === "RETURNED") {
        // Package returned to sender — mark cancelled so admin investigates
        await supabaseAdmin
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", order.id);
        console.log(`[tracking-sync] Marked returned/cancelled: ${order.id}`);
      }
      // TRANSIT / PRE_TRANSIT / UNKNOWN / FAILURE → stay as "shipped"

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Order ${order.id}: ${msg}`);
      console.error(`[tracking-sync] Error for ${order.id}:`, msg);
    }
  }

  return NextResponse.json({
    checked,
    delivered,
    errors: errors.length > 0 ? errors : undefined,
  });
}
