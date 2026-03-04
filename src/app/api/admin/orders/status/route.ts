import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

  // Update with delivered_at timestamp if status is "delivered"
  const updatePayload: Record<string, unknown> = { status };
  if (status === "delivered") {
    updatePayload.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updatePayload).eq("id", order_id);
  if (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }

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
