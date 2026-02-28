/**
 * GET /api/admin/analytics?period=30|60|90
 *
 * Admin-only. Returns aggregated analytics data using DB functions:
 * - get_revenue_by_day(days_back) → revenue + orders per day
 * - get_top_products(10) → top products by quantity sold
 * - get_customer_stats() → total/repeat customers, avg order value
 * - Live order status breakdown
 * - Newsletter subscriber count
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

  const period = parseInt(req.nextUrl.searchParams.get("period") || "30", 10);
  const days = [30, 60, 90].includes(period) ? period : 30;

  const supabase = await createAdminClient();

  const [
    revenueResult,
    topProductsResult,
    customerStatsResult,
    orderStatusResult,
    newsletterResult,
    lowStockResult,
    recentOrdersResult,
  ] = await Promise.allSettled([
    supabase.rpc("get_revenue_by_day", { days_back: days }),
    supabase.rpc("get_top_products", { limit_n: 10 }),
    supabase.rpc("get_customer_stats"),
    supabase.from("orders").select("status").not("status", "is", null),
    supabase.from("newsletter_subscribers").select("id, active"),
    supabase.from("products").select("id, name, stock_quantity").lt("stock_quantity", 5).eq("active", true),
    supabase.from("orders").select("id, total, status, created_at, name, email").order("created_at", { ascending: false }).limit(5),
  ]);

  const revenueByDay = revenueResult.status === "fulfilled" ? (revenueResult.value.data || []) : [];
  const topProducts = topProductsResult.status === "fulfilled" ? (topProductsResult.value.data || []) : [];
  const customerStats = customerStatsResult.status === "fulfilled" ? (customerStatsResult.value.data?.[0] || {}) : {};
  const allOrders = orderStatusResult.status === "fulfilled" ? (orderStatusResult.value.data || []) : [];
  const subscribers = newsletterResult.status === "fulfilled" ? (newsletterResult.value.data || []) : [];
  const lowStockItems = lowStockResult.status === "fulfilled" ? (lowStockResult.value.data || []) : [];
  const recentOrders = recentOrdersResult.status === "fulfilled" ? (recentOrdersResult.value.data || []) : [];

  // Compute order status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const order of allOrders) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
  }

  // Total revenue and orders for the period
  const totalRevenue = revenueByDay.reduce((sum: number, d: { revenue: number }) => sum + Number(d.revenue), 0);
  const totalOrders = revenueByDay.reduce((sum: number, d: { orders: number }) => sum + Number(d.orders), 0);

  const activeSubscribers = (subscribers as { active: boolean }[]).filter((s) => s.active).length;

  return NextResponse.json({
    period: days,
    revenue_by_day: revenueByDay,
    top_products: topProducts,
    customer_stats: customerStats,
    status_breakdown: statusBreakdown,
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    newsletter_subscribers: activeSubscribers,
    total_subscribers: subscribers.length,
    low_stock_items: lowStockItems,
    recent_orders: recentOrders,
  });
}
