/**
 * GET /api/cron/tracking-sync
 * Runs every 5 minutes via GitHub Actions.
 *
 * Full USPS → order status mapping:
 *
 *   Shippo status      Substatus              → Order status
 *   ─────────────────────────────────────────────────────────
 *   PRE_TRANSIT        (any)                  → "label_created"
 *   TRANSIT            (not out_for_delivery) → "in_transit"
 *   TRANSIT            out_for_delivery       → "out_for_delivery"
 *   DELIVERED          (any)                  → "delivered"
 *   RETURNED           (any)                  → "returned"
 *   FAILURE            (any)                  → stays as-is (alert only)
 *   UNKNOWN            (any)                  → stays as-is
 *
 * Auth: Bearer CRON_SECRET header.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTrackingStatus, detectCarrier } from "@/lib/shippo";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All in-progress statuses that still need tracking checks
const ACTIVE_STATUSES = ["shipped", "label_created", "in_transit", "out_for_delivery"];

/**
 * Map Shippo tracking response → our order status string.
 * Returns null if no change is needed.
 */
function mapShippoStatus(
  shippoStatus: string,
  substatusCode: string | null | undefined
): string | null {
  switch (shippoStatus) {
    case "PRE_TRANSIT":
      return "label_created";

    case "TRANSIT": {
      const sub = (substatusCode || "").toLowerCase();
      if (sub.includes("out_for_delivery") || sub.includes("out for delivery")) {
        return "out_for_delivery";
      }
      return "in_transit";
    }

    case "DELIVERED":
      return "delivered";

    case "RETURNED":
      return "returned";

    default:
      // UNKNOWN, FAILURE — don't change status
      return null;
  }
}

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active orders with tracking (last 60 days)
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, tracking_number, tracking_url, shipped_at")
    .in("status", ACTIVE_STATUSES)
    .not("tracking_number", "is", null)
    .gte("shipped_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("[tracking-sync] DB fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: "No active orders to check", checked: 0 });
  }

  const results: Record<string, number> = {
    checked: 0, updated: 0, unchanged: 0, errors: 0,
  };
  const errorList: string[] = [];

  for (const order of orders) {
    try {
      const carrier     = detectCarrier(order.tracking_url || "");
      const tracking    = await getTrackingStatus(carrier, order.tracking_number);
      const subCode     = tracking.substatus?.code;
      const newStatus   = mapShippoStatus(tracking.status, subCode);

      results.checked++;

      // Skip if no mapping or already at this status
      if (!newStatus || newStatus === order.status) {
        results.unchanged++;
        continue;
      }

      // Build update payload — always save latest tracking_history if non-empty
      const update: Record<string, unknown> = { status: newStatus };
      if (newStatus === "delivered") {
        update.delivered_at = tracking.status_date || new Date().toISOString();
      }
      if (tracking.tracking_history && tracking.tracking_history.length > 0) {
        update.tracking_events = tracking.tracking_history;
      }

      const { error: updateErr } = await supabaseAdmin
        .from("orders")
        .update(update)
        .eq("id", order.id);

      if (updateErr) {
        errorList.push(`${order.id}: ${updateErr.message}`);
        results.errors++;
      } else {
        results.updated++;
        console.log(`[tracking-sync] ${order.id}: ${order.status} → ${newStatus} (${tracking.status}/${subCode || "-"})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorList.push(`${order.id}: ${msg}`);
      results.errors++;
    }
  }

  return NextResponse.json({
    ...results,
    ...(errorList.length > 0 && { error_details: errorList }),
  });
}
