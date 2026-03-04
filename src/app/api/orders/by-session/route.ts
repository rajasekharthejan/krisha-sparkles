import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * GET /api/orders/by-session?session_id=cs_xxx
 *
 * Returns the order reference for a given Stripe checkout session ID.
 * Used by the order success page to display the real order reference.
 *
 * SECURITY: Rate limited + session_id format validated + 24hr time window.
 */
export async function GET(req: NextRequest) {
  // Rate limit: 10 lookups per minute per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`orders-by-session:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  // Validate session_id format (Stripe session IDs start with cs_)
  if (!sessionId.startsWith("cs_") || sessionId.length < 20) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Only return orders created within the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .gte("created_at", twentyFourHoursAgo)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order_ref: order.id.slice(-8).toUpperCase(),
  });
}
