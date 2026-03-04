/**
 * Admin Users API
 * GET  /api/admin/users        — list all users with profiles
 * DELETE /api/admin/users?id=  — delete a specific user
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Fetch all auth users via admin API
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw authErr;

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, phone, points_balance, created_at");

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Fetch order stats per user
    const { data: orderStats } = await supabase
      .from("orders")
      .select("user_id, total, status")
      .not("user_id", "is", null);

    const statsMap = new Map<string, { count: number; spent: number }>();
    for (const o of orderStats || []) {
      if (!o.user_id) continue;
      const cur = statsMap.get(o.user_id) || { count: 0, spent: 0 };
      cur.count += 1;
      cur.spent += Number(o.total || 0);
      statsMap.set(o.user_id, cur);
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@krishasparkles.com";

    const users = (authData?.users || []).map((u) => {
      const profile = profileMap.get(u.id);
      const stats = statsMap.get(u.id) || { count: 0, spent: 0 };
      return {
        id: u.id,
        email: u.email,
        is_admin: u.email === adminEmail,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        phone: profile?.phone || "",
        points_balance: profile?.points_balance || 0,
        order_count: stats.count,
        total_spent: stats.spent,
      };
    });

    // Sort: admins first, then by created_at desc
    users.sort((a, b) => {
      if (a.is_admin && !b.is_admin) return -1;
      if (!a.is_admin && b.is_admin) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ users, total: users.length });
  } catch (err: unknown) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const supabase = await createAdminClient();

    // Safety: never delete admin
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const adminEmail = process.env.ADMIN_EMAIL || "admin@krishasparkles.com";
    if (authUser?.user?.email === adminEmail) {
      return NextResponse.json({ error: "Cannot delete admin user" }, { status: 403 });
    }

    // Delete profile (CASCADE should handle it, but be explicit)
    await supabase.from("user_profiles").delete().eq("id", userId);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Admin user delete error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
