import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Hardcoded defaults — returned if the DB table doesn't exist yet or has no rows
const DEFAULTS = {
  free_shipping_threshold: 75,
  standard_shipping_rate: 9.99,
  express_shipping_rate: 14.99,
};

export const revalidate = 60; // ISR: re-fetch from DB at most once per minute

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("store_settings")
      .select("key, value")
      .in("key", ["free_shipping_threshold", "standard_shipping_rate", "express_shipping_rate"]);

    const settings = { ...DEFAULTS };
    if (data) {
      for (const row of data) {
        const num = parseFloat(row.value);
        if (!isNaN(num) && row.key in settings) {
          (settings as Record<string, number>)[row.key] = num;
        }
      }
    }

    return NextResponse.json(settings, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    // Always return usable defaults — never break the checkout page
    return NextResponse.json(DEFAULTS);
  }
}
