/**
 * POST /api/push/subscribe
 *
 * Saves a Web Push subscription to push_subscriptions table.
 * Requires user auth (user_id stored with subscription).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { endpoint, p256dh, auth } = await req.json();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
  }

  // Optional: get user_id from auth header
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await anonSupabase.auth.getUser(token);
    userId = user?.id || null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint, p256dh, auth, user_id: userId }, { onConflict: "endpoint" });

  if (error) return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });

  return NextResponse.json({ success: true });
}
