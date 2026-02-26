import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const { order_id, user_id, email, reason, details } = await req.json();

    if (!order_id || !user_id || !email || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = serviceClient();

    // Verify the order belongs to this user
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", order_id)
      .eq("user_id", user_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Cannot request refund for a cancelled order" }, { status: 400 });
    }

    // Check for existing refund request
    const { data: existing } = await supabase
      .from("refund_requests")
      .select("id")
      .eq("order_id", order_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A refund request already exists for this order" }, { status: 409 });
    }

    const { error } = await supabase.from("refund_requests").insert({
      order_id,
      user_id,
      email,
      reason,
      details: details || null,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
