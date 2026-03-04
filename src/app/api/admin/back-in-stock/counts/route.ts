/**
 * GET /api/admin/back-in-stock/counts
 *
 * Returns the count of pending (notified=false) back-in-stock requests
 * grouped by product_id. Used by the admin inventory page to show waitlist sizes.
 *
 * SECURITY: Requires admin session (cookie-based auth + admin email check).
 * Returns: { counts: Record<product_id, count> }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all pending (unnotified) requests grouped by product_id
    const { data, error } = await admin
      .from("back_in_stock_requests")
      .select("product_id")
      .eq("notified", false);

    if (error) throw error;

    // Aggregate counts by product_id
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.product_id] = (counts[row.product_id] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("Back-in-stock counts error:", err);
    return NextResponse.json({ counts: {} });
  }
}
