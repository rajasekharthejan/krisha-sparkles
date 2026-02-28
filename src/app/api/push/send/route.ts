/**
 * POST /api/push/send
 *
 * Admin-only. Sends a Web Push notification to all or specific subscribers.
 *
 * Body: { title, body, url?, tag?, user_id? }
 * If user_id provided: sends only to that user's subscriptions.
 * Otherwise: broadcasts to all active subscriptions.
 *
 * Requires web-push package: npm install web-push
 * Set VAPID keys in env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import webpushModule from "web-push";

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
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:hello@shopkrisha.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured. Generate with: npx web-push generate-vapid-keys" }, { status: 503 });
  }

  const { title, body, url = "/", tag = "krisha-push", user_id } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  let query = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (user_id) query = query.eq("user_id", user_id);

  const { data: subscriptions } = await query;

  if (!subscriptions?.length) {
    return NextResponse.json({ success: true, sent: 0, message: "No subscriptions found" });
  }

  const webpush = webpushModule;
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({ title, body, url, tag });
  let sent = 0, failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch {
        failed++;
        // Remove dead subscriptions
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    })
  );

  return NextResponse.json({ success: true, sent, failed });
}
