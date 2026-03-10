/**
 * POST /api/admin/shippo/cancel-label
 * Requests a refund for a purchased Shippo label.
 * Clears tracking / label fields from the order after a successful refund request.
 *
 * Body: { order_id }
 * Returns: { success, refund_status }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { refundLabel } from "@/lib/shippo";
import { getShippoApiKey } from "@/lib/paymentMode";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) {
    return NextResponse.json({ error: "order_id is required" }, { status: 400 });
  }

  // Fetch order to get the Shippo transaction ID and tracking number
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("shippo_transaction_id, tracking_number, label_url, status")
    .eq("id", order_id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.shippo_transaction_id && !order.tracking_number && !order.label_url) {
    return NextResponse.json({ error: "No Shippo label found for this order" }, { status: 400 });
  }

  try {
    let transactionId = order.shippo_transaction_id;

    // For older orders: look up Shippo transaction by tracking number
    if (!transactionId && order.tracking_number) {
      const shippoKey = await getShippoApiKey();
      const res = await fetch(
        `https://api.goshippo.com/transactions/?tracking_number=${order.tracking_number}&results=5`,
        { headers: { Authorization: `ShippoToken ${shippoKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const match = data.results?.find(
          (t: { tracking_number: string; object_id: string }) => t.tracking_number === order.tracking_number
        );
        if (match) transactionId = match.object_id;
      }
    }

    if (!transactionId) {
      return NextResponse.json({ error: "Could not find Shippo transaction. Please cancel manually at app.goshippo.com" }, { status: 400 });
    }

    // Call Shippo refund API
    const refund = await refundLabel(transactionId);

    // Clear label / tracking fields from order and revert status to "paid"
    await supabaseAdmin
      .from("orders")
      .update({
        tracking_number:       null,
        tracking_url:          null,
        label_url:             null,
        shippo_transaction_id: null,
        shipped_at:            null,
        status:                "paid",
      })
      .eq("id", order_id);

    return NextResponse.json({
      success: true,
      refund_status: refund.status,
      refund_id: refund.object_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel label";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
