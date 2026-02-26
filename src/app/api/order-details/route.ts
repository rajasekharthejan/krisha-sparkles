import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, order_items(product_id, product_name, quantity, price)")
    .eq("stripe_session_id", sessionId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    total: order.total,
    items: (order.order_items || []).map((item: { product_id: string; product_name: string; quantity: number; price: number }) => ({
      productId: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
}
