import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Cache for 60 seconds so we don't hit DB on every page load
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("coupons")
      .select("code, discount_type, discount_value, expires_at")
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())   // not expired
      .order("expires_at", { ascending: true })      // soonest expiry first
      .limit(1)
      .single();

    return NextResponse.json({ coupon: data ?? null });
  } catch {
    return NextResponse.json({ coupon: null });
  }
}
