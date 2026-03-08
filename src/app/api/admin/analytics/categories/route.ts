/**
 * GET /api/admin/analytics/categories?period=30
 *
 * Admin-only. Returns revenue breakdown by product category.
 * Uses get_category_revenue(days_back) RPC function.
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

// Category colors for charts
const CATEGORY_COLORS = [
  "#c9a84c", // gold
  "#10b981", // emerald
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periodParam = parseInt(req.nextUrl.searchParams.get("period") || "30", 10);
  const period = [30, 60, 90].includes(periodParam) ? periodParam : 30;

  const supabase = await createAdminClient();

  const { data: rawCategories, error } = await supabase.rpc("get_category_revenue", {
    days_back: period,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (rawCategories || []) as {
    category_name: string;
    category_id: string;
    total_revenue: number;
    total_units: number;
    order_count: number;
  }[];

  // Calculate total for share percentages
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_revenue), 0);

  const categories = rows.map((r, i) => ({
    category_name: r.category_name,
    category_id: r.category_id,
    total_revenue: Number(r.total_revenue),
    total_units: Number(r.total_units),
    order_count: Number(r.order_count),
    share: totalRevenue > 0 ? Math.round((Number(r.total_revenue) / totalRevenue) * 100) : 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return NextResponse.json({
    period,
    total_revenue: totalRevenue,
    categories,
  });
}
