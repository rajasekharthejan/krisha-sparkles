import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/orders/by-session?session_id=cs_xxx
 * Returns the order ID for a given Stripe checkout session ID.
 * Used by the order success page to display the real order reference.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order_id: order.id,
    order_ref: order.id.slice(-8).toUpperCase(),
  });
}
