import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * GET /api/order-details?session_id=cs_xxx
 *
 * SECURITY: Rate limited + session_id format validated + 24hr time window.
 * Stripe session IDs are high-entropy random values (~66 chars), making
 * brute-force impractical, but we add defense-in-depth measures.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 10 lookups per minute per IP
  const ip = getClientIp(request);
  const rl = rateLimit(`order-details:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // Validate session_id format (Stripe session IDs start with cs_)
  if (!sessionId.startsWith("cs_") || sessionId.length < 20) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Only return orders created within the last 24 hours (limits exposure window)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, order_items(product_name, quantity, price)")
    .eq("stripe_session_id", sessionId)
    .gte("created_at", twentyFourHoursAgo)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    total: order.total,
    items: (order.order_items || []).map((item: { product_name: string; quantity: number; price: number }) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
}
