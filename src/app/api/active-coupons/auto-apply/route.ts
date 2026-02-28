import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Coupon } from "../route";

// Cache for 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id, code, type, value, expires_at, max_uses, uses_count, show_banner, auto_apply, banner_text, discount_type, discount_value, active"
      )
      .eq("active", true)
      .eq("auto_apply", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("expires_at", { ascending: true, nullsFirst: false })
      .limit(1);

    if (error) throw error;

    const raw = data?.[0] as Record<string, unknown> | undefined;
    const coupon: Coupon | null = raw
      ? {
          id: raw.id as string,
          code: raw.code as string,
          type: ((raw.type ?? raw.discount_type ?? "percentage") as "percentage" | "fixed"),
          value: ((raw.value ?? raw.discount_value ?? 0) as number),
          expires_at: (raw.expires_at as string | null) ?? null,
          max_uses: (raw.max_uses as number | null) ?? null,
          uses_count: (raw.uses_count as number) ?? 0,
          show_banner: (raw.show_banner as boolean) ?? false,
          auto_apply: (raw.auto_apply as boolean) ?? true,
          banner_text: (raw.banner_text as string | null) ?? null,
          discount_type: raw.discount_type as "percentage" | "fixed" | undefined,
          discount_value: raw.discount_value as number | undefined,
        }
      : null;

    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ coupon: null });
  }
}
