/**
 * GET /api/admin/analytics/funnels?period=30
 *
 * Admin-only. Returns order-stage conversion funnel data.
 * Uses get_conversion_funnel(days_back) RPC function.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periodParam = parseInt(req.nextUrl.searchParams.get("period") || "30", 10);
  const period = [30, 60, 90].includes(periodParam) ? periodParam : 30;

  const supabase = await createAdminClient();

  const { data: rawSteps, error } = await supabase.rpc("get_conversion_funnel", {
    days_back: period,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (rawSteps || []) as { step_name: string; step_count: number }[];

  // Find the base (All Orders) count for rate calculation
  const allOrdersRow = rows.find((r) => r.step_name === "All Orders");
  const baseCount = allOrdersRow ? Number(allOrdersRow.step_count) : 1;

  const steps = rows.map((r) => ({
    name: r.step_name,
    count: Number(r.step_count),
    rate: baseCount > 0 ? Math.round((Number(r.step_count) / baseCount) * 100) : 0,
  }));

  return NextResponse.json({ period, steps });
}
