/**
 * GET  /api/admin/newsletter/subscribers?page=1&limit=50
 * PATCH /api/admin/newsletter/subscribers  { id, active }
 *
 * SECURITY: Admin-only. Requires cookie-based session + admin email check.
 */

import { NextRequest, NextResponse } from "next/server";
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

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const offset = (page - 1) * limit;

  const supabase = getAdminClient();

  const [{ data: subscribers, error }, { count }] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, email, name, active, subscribed_at")
      .order("subscribed_at", { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true }),
  ]);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }

  return NextResponse.json({
    subscribers: subscribers || [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, active } = await req.json();
  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "id and active required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({ active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
