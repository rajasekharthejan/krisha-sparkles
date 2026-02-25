import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { code, orderTotal } = await req.json();

  if (!code) {
    return NextResponse.json({ valid: false, error: "No coupon code provided" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!coupon) {
    return NextResponse.json({ valid: false, error: "Invalid coupon code" });
  }
  if (!coupon.active) {
    return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "This coupon has expired" });
  }
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
  }
  if (orderTotal !== undefined && orderTotal < coupon.min_order_amount) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of $${coupon.min_order_amount.toFixed(2)} required for this coupon`,
    });
  }

  const subtotal = orderTotal || 0;
  const discount =
    coupon.discount_type === "percentage"
      ? Math.round((subtotal * coupon.discount_value) / 100 * 100) / 100
      : Math.min(coupon.discount_value, subtotal);

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description,
    },
    discount,
  });
}
