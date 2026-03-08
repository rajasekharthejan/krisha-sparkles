/**
 * GET /api/admin/analytics/ltv
 *
 * Admin-only. Returns customer lifetime value statistics.
 * Uses get_customer_ltv() RPC function.
 */

import { NextResponse } from "next/server";
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

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();

  const { data: rawLtv, error } = await supabase.rpc("get_customer_ltv");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = (rawLtv || []) as {
    email: string;
    name: string;
    total_spent: number;
    order_count: number;
    first_purchase: string;
    last_purchase: string;
    avg_order_value: number;
  }[];

  if (customers.length === 0) {
    return NextResponse.json({
      avg_ltv: 0,
      median_ltv: 0,
      top_10_pct_ltv: 0,
      total_customers: 0,
      ltv_distribution: [],
      top_customers: [],
      ltv_trend: [],
    });
  }

  // Compute aggregate stats
  const spentValues = customers.map((c) => Number(c.total_spent));
  const avg_ltv = spentValues.reduce((a, b) => a + b, 0) / spentValues.length;

  // Median
  const sorted = [...spentValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median_ltv = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Top 10% average
  const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));
  const top10Slice = sorted.slice(-top10Count);
  const top_10_pct_ltv = top10Slice.reduce((a, b) => a + b, 0) / top10Slice.length;

  // Distribution buckets
  const buckets = [
    { label: "$0–25", min: 0, max: 25 },
    { label: "$25–50", min: 25, max: 50 },
    { label: "$50–100", min: 50, max: 100 },
    { label: "$100–200", min: 100, max: 200 },
    { label: "$200–500", min: 200, max: 500 },
    { label: "$500+", min: 500, max: Infinity },
  ];
  const ltv_distribution = buckets.map((b) => ({
    label: b.label,
    count: spentValues.filter((v) => v >= b.min && v < b.max).length,
  }));

  // Top 20 customers
  const top_customers = customers.slice(0, 20).map((c) => ({
    email: c.email,
    name: c.name,
    total_spent: Number(c.total_spent),
    order_count: Number(c.order_count),
    first_purchase: c.first_purchase,
    last_purchase: c.last_purchase,
    avg_order_value: Number(c.avg_order_value),
  }));

  // LTV trend by first-purchase month (avg LTV per cohort)
  const trendMap = new Map<string, { total: number; count: number }>();
  for (const c of customers) {
    const month = c.first_purchase ? new Date(c.first_purchase).toISOString().slice(0, 7) : "unknown";
    const entry = trendMap.get(month) || { total: 0, count: 0 };
    entry.total += Number(c.total_spent);
    entry.count += 1;
    trendMap.set(month, entry);
  }
  const ltv_trend = Array.from(trendMap.entries())
    .filter(([k]) => k !== "unknown")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      avg_ltv: Math.round((v.total / v.count) * 100) / 100,
      customers: v.count,
    }));

  return NextResponse.json({
    avg_ltv: Math.round(avg_ltv * 100) / 100,
    median_ltv: Math.round(median_ltv * 100) / 100,
    top_10_pct_ltv: Math.round(top_10_pct_ltv * 100) / 100,
    total_customers: customers.length,
    ltv_distribution,
    top_customers,
    ltv_trend,
  });
}
