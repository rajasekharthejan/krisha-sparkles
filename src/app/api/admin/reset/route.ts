/**
 * Data Reset API — clears ALL transient/test data.
 * POST /api/admin/reset
 *
 * KEEPS (master data):
 *   - categories, products, bundles, coupons, blog_posts, collections
 *   - admin auth.user + admin_login_attempts
 *
 * DELETES (transient data):
 *   - orders + order_items (CASCADE)
 *   - all non-admin auth.users + user_profiles
 *   - back_in_stock_requests
 *   - newsletter_subscribers
 *   - email_logs, email_campaigns
 *   - reviews, contact_messages, push_subscriptions
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

export async function POST(req: NextRequest) {
  // SECURITY: Double-lock — require both admin session AND CRON_SECRET header
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("x-cron-secret");
  if (!cronSecret || authHeader !== cronSecret) {
    return NextResponse.json({ error: "Forbidden — missing security token" }, { status: 403 });
  }

  // Require a confirmation token in the body
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "RESET_ALL_DATA") {
    return NextResponse.json({ error: "Confirmation token missing" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@krishasparkles.com";
  const results: Record<string, string> = {};

  async function clearTable(table: string, filter?: { col: string; val: unknown }) {
    try {
      let q = supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // dummy to force filter
      if (filter) q = (supabase.from(table).delete() as any).eq(filter.col, filter.val);
      else q = (supabase.from(table).delete() as any).gte("created_at", "2000-01-01");
      const { error } = await q;
      results[table] = error ? `❌ ${error.message}` : "✅ cleared";
    } catch (e) {
      results[table] = `❌ ${e}`;
    }
  }

  // 1. Clear orders (CASCADE deletes order_items automatically)
  try {
    const { error } = await supabase.from("orders").delete().gte("created_at", "2000-01-01");
    results["orders"] = error ? `❌ ${error.message}` : "✅ cleared";
  } catch (e) { results["orders"] = `❌ ${e}`; }

  // 2. Clear transient tables
  const tables = [
    "back_in_stock_requests",
    "newsletter_subscribers",
    "email_logs",
    "email_campaigns",
    "reviews",
    "contact_messages",
    "push_subscriptions",
  ];

  for (const t of tables) {
    try {
      const { error } = await (supabase.from(t).delete() as any).gte("created_at", "2000-01-01");
      results[t] = error ? `❌ ${error.message}` : "✅ cleared";
    } catch (e) {
      results[t] = `⚠️ skipped (table may not exist)`;
    }
  }

  // 3. Delete all non-admin auth.users
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const nonAdminUsers = (authData?.users || []).filter((u) => u.email !== adminEmail);
    let deletedUsers = 0;
    for (const u of nonAdminUsers) {
      await supabase.from("user_profiles").delete().eq("id", u.id);
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (!error) deletedUsers++;
    }
    results["auth.users (non-admin)"] = `✅ deleted ${deletedUsers} users`;
  } catch (e) {
    results["auth.users"] = `❌ ${e}`;
  }

  return NextResponse.json({ success: true, results });
}
