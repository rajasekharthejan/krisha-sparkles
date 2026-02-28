import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Cache for 60 seconds — banners rarely change mid-session
export const revalidate = 60;

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  show_banner: boolean;
  auto_apply: boolean;
  banner_text: string | null;
  // Legacy fields (the original schema uses discount_type / discount_value)
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id, code, type, value, expires_at, max_uses, uses_count, show_banner, auto_apply, banner_text, discount_type, discount_value, active"
      )
      .eq("active", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("expires_at", { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Filter show_banner = true; normalise type/value from legacy columns
    const coupons: Coupon[] = (data ?? [])
      .filter((c: Record<string, unknown>) => c.show_banner === true)
      .map((c: Record<string, unknown>) => ({
        id: c.id as string,
        code: c.code as string,
        // Support both new (type/value) and legacy (discount_type/discount_value) schemas
        type: ((c.type ?? c.discount_type ?? "percentage") as "percentage" | "fixed"),
        value: ((c.value ?? c.discount_value ?? 0) as number),
        expires_at: (c.expires_at as string | null) ?? null,
        max_uses: (c.max_uses as number | null) ?? null,
        uses_count: (c.uses_count as number) ?? 0,
        show_banner: (c.show_banner as boolean) ?? false,
        auto_apply: (c.auto_apply as boolean) ?? false,
        banner_text: (c.banner_text as string | null) ?? null,
        discount_type: (c.discount_type as "percentage" | "fixed" | undefined),
        discount_value: (c.discount_value as number | undefined),
      }));

    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ coupons: [] });
  }
}
