/**
 * GET /api/admin/loyalty
 *
 * Returns loyalty tier statistics and user breakdown for admin dashboard.
 * - Tier distribution (count per tier)
 * - Top loyalty users with tier info
 *
 * Admin auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
    return user.email === adminEmail;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    const tier = url.searchParams.get("tier"); // filter by tier
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    // Tier distribution counts + lifetime points in one query
    const { data: allProfiles } = await admin
      .from("user_profiles")
      .select("loyalty_tier, lifetime_points");

    const distribution: Record<string, number> = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
    let totalLifetimePoints = 0;

    if (allProfiles) {
      for (const p of allProfiles) {
        const t = p.loyalty_tier || "bronze";
        distribution[t] = (distribution[t] || 0) + 1;
        totalLifetimePoints += p.lifetime_points || 0;
      }
    }

    // Users query (paginated, optionally filtered by tier)
    let query = admin
      .from("user_profiles")
      .select("id, first_name, last_name, email, loyalty_tier, lifetime_points, points_balance, tier_upgraded_at, birthday", { count: "exact" })
      .order("lifetime_points", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tier && ["bronze", "silver", "gold", "diamond"].includes(tier)) {
      query = query.eq("loyalty_tier", tier);
    }

    const { data: users, count } = await query;

    return NextResponse.json({
      distribution,
      total_users: allProfiles?.length || 0,
      total_lifetime_points: totalLifetimePoints,
      users: users || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("Admin loyalty error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
