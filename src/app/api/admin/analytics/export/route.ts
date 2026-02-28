/**
 * GET /api/admin/analytics/export?period=30
 *
 * Admin-only. Streams a CSV file of all orders for the given period.
 * Columns: Date, Order ID, Customer, Email, Items, Total, Status, Tracking
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

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = parseInt(req.nextUrl.searchParams.get("period") || "30", 10);
  const days = [30, 60, 90].includes(period) ? period : 30;

  const supabase = await createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, name, email, total, status, tracking_number, order_items(product_name, quantity, price)")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const rows: string[] = [
    ["Date", "Order ID", "Customer", "Email", "Items", "Total", "Status", "Tracking #"].join(","),
  ];

  for (const order of orders || []) {
    const itemCount = (order.order_items as { quantity: number }[] || []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    rows.push([
      escapeCSV(new Date(order.created_at).toLocaleDateString("en-US")),
      escapeCSV(`#${order.id.slice(0, 8).toUpperCase()}`),
      escapeCSV(order.name),
      escapeCSV(order.email),
      escapeCSV(itemCount),
      escapeCSV(`$${Number(order.total).toFixed(2)}`),
      escapeCSV(order.status),
      escapeCSV(order.tracking_number || ""),
    ].join(","));
  }

  const csv = rows.join("\n");
  const filename = `krisha-sparkles-orders-${days}d-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
