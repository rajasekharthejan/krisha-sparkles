import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTierConfig, type LoyaltyTierName } from "@/lib/loyalty-tiers";
import { sendTierUpgradeEmail } from "@/lib/email";
import {
  sendWhatsAppShippingUpdate,
  sendWhatsAppLabelCreated,
  sendWhatsAppInTransit,
  sendWhatsAppOutForDelivery,
  sendWhatsAppDelivered,
  sendWhatsAppCancelled,
} from "@/lib/whatsapp-notify";

// SECURITY: Whitelist of valid order statuses — prevents arbitrary DB values
const VALID_STATUSES = [
  "pending", "paid", "shipped", "label_created",
  "in_transit", "out_for_delivery", "delivered",
  "cancelled", "returned",
];

// Statuses that trigger WhatsApp notifications (if customer opted in)
const WA_NOTIFY_STATUSES = [
  "shipped", "label_created", "in_transit",
  "out_for_delivery", "delivered", "cancelled",
];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order_id, status } = await req.json();
  if (!order_id || !status) {
    return NextResponse.json({ error: "Missing order_id or status" }, { status: 400 });
  }

  // Validate status against whitelist
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  // Fetch current order state BEFORE update — needed for points logic
  const { data: currentOrder } = await supabase
    .from("orders")
    .select("status, user_id, total, points_earned, email")
    .eq("id", order_id)
    .single();

  const prevStatus = currentOrder?.status as string | undefined;
  const userId = currentOrder?.user_id as string | null | undefined;

  // Build update payload
  const updatePayload: Record<string, unknown> = { status };
  if (status === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updatePayload).eq("id", order_id);
  if (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }

  // ─── LOYALTY POINTS LOGIC ───────────────────────────────────────────────────
  // Points are awarded ONLY when order reaches "delivered".
  // Points are reversed ONLY when order moves FROM "delivered" to any other status.
  // This guarantees customers earn only for fulfilled orders, and cancellations/
  // returns cleanly claw back the exact points that were awarded.

  if (userId) {
    // AWARD: transition into "delivered"
    if (status === "delivered" && prevStatus !== "delivered") {
      try {
        const orderTotal: number = currentOrder?.total || 0;

        // Fetch user's current tier for the points multiplier
        const { data: tierProfile } = await supabase
          .from("user_profiles")
          .select("loyalty_tier, lifetime_points")
          .eq("id", userId)
          .single();

        const tierName = (tierProfile?.loyalty_tier || "bronze") as LoyaltyTierName;
        const tierConfig = getTierConfig(tierName);

        const basePts = Math.floor(orderTotal);                      // 1 pt per $1
        const pts = Math.floor(basePts * tierConfig.pointsMultiplier); // tier multiplier

        if (pts > 0) {
          // Increment redeemable balance
          await supabase.rpc("increment_points", { user_id: userId, pts });

          // Store exact points awarded on the order — used for reversal
          await supabase
            .from("orders")
            .update({ points_earned: pts })
            .eq("id", order_id);

          // Increment lifetime_points + check for tier upgrade
          try {
            const { data: newTier } = await supabase.rpc("increment_lifetime_points", {
              p_user_id: userId,
              p_pts: basePts, // lifetime uses base (un-multiplied) for fair tier progression
            });

            // Send tier upgrade email if tier changed
            if (newTier && newTier !== tierName) {
              const newTierConfig = getTierConfig(newTier as LoyaltyTierName);
              const email = currentOrder?.email;
              if (email) {
                sendTierUpgradeEmail(email, newTierConfig.label, newTierConfig.icon, newTierConfig.color)
                  .catch(() => console.error("Failed to send tier upgrade email"));
              }
              console.log(`User ${userId.slice(-8)} upgraded: ${tierName} → ${newTier}`);
            }
          } catch {
            // Fallback: increment lifetime_points manually if RPC missing
            try {
              await supabase
                .from("user_profiles")
                .update({ lifetime_points: (tierProfile?.lifetime_points || 0) + basePts })
                .eq("id", userId);
            } catch {
              console.error("Failed to increment lifetime points");
            }
          }

          console.log(`Order ${order_id.slice(-8)} delivered — awarded ${pts} pts to user ${userId.slice(-8)}`);
        }
      } catch {
        console.error("Failed to award loyalty points on delivery");
      }
    }

    // REVERSE: transition OUT of "delivered"
    else if (prevStatus === "delivered" && status !== "delivered") {
      const pointsToReverse: number = currentOrder?.points_earned || 0;

      if (pointsToReverse > 0) {
        try {
          // Deduct using atomic RPC (prevents race if two status changes happen fast)
          const { data: deductOk } = await supabase.rpc("deduct_points_atomic", {
            p_user_id: userId,
            p_amount: pointsToReverse,
          });

          if (deductOk === false) {
            // Fallback: non-atomic deduction
            const { data: profileData } = await supabase
              .from("user_profiles")
              .select("points_balance")
              .eq("id", userId)
              .single();
            if (profileData) {
              const newBalance = Math.max(0, (profileData.points_balance || 0) - pointsToReverse);
              await supabase
                .from("user_profiles")
                .update({ points_balance: newBalance })
                .eq("id", userId);
            }
          }

          // Reset points_earned on order so reversal can't be double-applied
          await supabase
            .from("orders")
            .update({ points_earned: 0 })
            .eq("id", order_id);

          console.log(`Order ${order_id.slice(-8)} moved ${prevStatus}→${status} — reversed ${pointsToReverse} pts from user ${userId.slice(-8)}`);
        } catch {
          console.error("Failed to reverse loyalty points");
        }
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Send WhatsApp notification for order status changes (non-blocking)
  if (WA_NOTIFY_STATUSES.includes(status)) {
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("id, notify_whatsapp, phone, tracking_number")
        .eq("id", order_id)
        .single();

      if (order?.notify_whatsapp && order.phone) {
        const orderRef = order.id.slice(-8).toUpperCase();
        switch (status) {
          case "shipped":
            if (order.tracking_number) {
              sendWhatsAppShippingUpdate(order.phone, orderRef, order.tracking_number, order.id).catch(() => {});
            }
            break;
          case "label_created":
            sendWhatsAppLabelCreated(order.phone, orderRef, order.id).catch(() => {});
            break;
          case "in_transit":
            sendWhatsAppInTransit(order.phone, orderRef, order.id).catch(() => {});
            break;
          case "out_for_delivery":
            sendWhatsAppOutForDelivery(order.phone, orderRef, order.id).catch(() => {});
            break;
          case "delivered":
            sendWhatsAppDelivered(order.phone, orderRef, order.id).catch(() => {});
            break;
          case "cancelled":
            sendWhatsAppCancelled(order.phone, orderRef, order.id).catch(() => {});
            break;
        }
      }
    } catch {
      // WhatsApp notification failure is non-blocking
    }
  }

  return NextResponse.json({ success: true });
}
