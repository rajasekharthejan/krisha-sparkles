import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { sendRefundStatusEmail } from "@/lib/email";
import { sendWhatsAppRefundUpdate } from "@/lib/whatsapp-notify";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Auth check
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const supabase = getAdminClient();

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, email, name, total, status, stripe_payment_intent_id, notify_whatsapp, phone")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Prevent double-refund
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
  }

  // Must have a payment intent to refund
  if (!order.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "No Stripe payment found for this order. Refund manually in the Stripe Dashboard." },
      { status: 400 }
    );
  }

  // Issue the Stripe refund (full amount)
  const stripe = await getStripe();
  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      // amount is in cents — omitting = full refund
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (stripeRefund.status !== "succeeded" && stripeRefund.status !== "pending") {
    return NextResponse.json(
      { error: `Stripe refund status: ${stripeRefund.status}` },
      { status: 500 }
    );
  }

  // Update order status to cancelled + store refund ID
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      notes: `Refunded via admin. Stripe refund ID: ${stripeRefund.id}`,
    })
    .eq("id", order_id);

  if (updateError) {
    // Refund went through on Stripe but DB update failed — log it
    console.error("DB update failed after Stripe refund:", updateError.message);
  }

  // Send confirmation email to customer (non-blocking)
  const refundMessage = `Your full refund of $${order.total.toFixed(2)} has been processed. It will appear on your card within 3–5 business days.`;
  sendRefundStatusEmail({
    email: order.email,
    orderId: order.id,
    status: "approved",
    adminNotes: refundMessage,
  }).catch(() => {});

  // Send WhatsApp refund notification (non-blocking)
  if (order.notify_whatsapp && order.phone) {
    sendWhatsAppRefundUpdate(
      order.phone,
      order.id.slice(-8).toUpperCase(),
      "approved",
      refundMessage,
      order.id,
    ).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    refund_id: stripeRefund.id,
    amount: order.total,
    status: stripeRefund.status,
  });
}
