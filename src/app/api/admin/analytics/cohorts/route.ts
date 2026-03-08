/**
 * GET /api/admin/analytics/cohorts?months=6
 *
 * Admin-only. Returns customer cohort retention data.
 * Uses get_customer_cohorts(months_back) RPC function.
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

  const monthsParam = parseInt(req.nextUrl.searchParams.get("months") || "6", 10);
  const months = [3, 6, 12].includes(monthsParam) ? monthsParam : 6;

  const supabase = await createAdminClient();

  const { data: rawCohorts, error } = await supabase.rpc("get_customer_cohorts", {
    months_back: months,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform raw rows into a structured cohort grid
  // rawCohorts: [{ cohort_month, period_offset, customer_count, total_revenue }]
  const rows = (rawCohorts || []) as {
    cohort_month: string;
    period_offset: number;
    customer_count: number;
    total_revenue: number;
  }[];

  // Group by cohort_month
  const cohortMap = new Map<string, { month: string; initial_customers: number; retention: number[]; revenue: number[] }>();

  for (const row of rows) {
    const key = row.cohort_month;
    if (!cohortMap.has(key)) {
      cohortMap.set(key, { month: key, initial_customers: 0, retention: [], revenue: [] });
    }
    const cohort = cohortMap.get(key)!;
    if (row.period_offset === 0) {
      cohort.initial_customers = Number(row.customer_count);
    }
    // Store at the offset index
    cohort.retention[row.period_offset] = Number(row.customer_count);
    cohort.revenue[row.period_offset] = Number(row.total_revenue);
  }

  // Convert retention counts to percentages relative to Month 0
  const cohorts = Array.from(cohortMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((c) => {
      const base = c.initial_customers || 1;
      const retentionPct = c.retention.map((count) =>
        Math.round((count / base) * 100)
      );
      return {
        month: c.month,
        initial_customers: c.initial_customers,
        retention: retentionPct,
        revenue: c.revenue,
      };
    });

  // Determine max period offset across all cohorts
  const maxOffset = cohorts.reduce(
    (max, c) => Math.max(max, c.retention.length - 1),
    0
  );

  return NextResponse.json({
    months,
    max_offset: maxOffset,
    cohorts,
  });
}
