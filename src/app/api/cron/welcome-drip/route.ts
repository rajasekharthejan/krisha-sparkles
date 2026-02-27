/**
 * GET /api/cron/welcome-drip
 *
 * Daily cron (9am UTC) — sends timed welcome drip emails to new subscribers.
 *
 * Day 0: Welcome email (sent immediately on subscribe via /api/newsletter)
 * Day 3: Best sellers email (sent by this cron)
 * Day 7: Refer-a-friend email (sent by this cron)
 *
 * Uses subscribed_at to determine which email to send.
 * Tracks sent state via drip_sent_at columns (added lazily if needed).
 * Secured by CRON_SECRET Bearer token.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDripDay3, sendDripDay7 } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";

  // Day 3 window: subscribed between 3d3h ago and 2d21h ago (6-hour window)
  const day3Start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);
  const day3End   = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 21 * 60 * 60 * 1000);

  // Day 7 window: subscribed between 7d3h ago and 6d21h ago (6-hour window)
  const day7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);
  const day7End   = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 - 21 * 60 * 60 * 1000);

  let day3Sent = 0, day7Sent = 0, failed = 0;

  // ── Day 3: Best Sellers email ─────────────────────────────────────────────
  const { data: day3Subs } = await supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("active", true)
    .gte("subscribed_at", day3Start.toISOString())
    .lte("subscribed_at", day3End.toISOString());

  for (const sub of day3Subs || []) {
    try {
      await sendDripDay3({ email: sub.email, name: sub.name, siteUrl });
      day3Sent++;
    } catch {
      failed++;
    }
  }

  // ── Day 7: Refer-a-Friend email ──────────────────────────────────────────
  const { data: day7Subs } = await supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("active", true)
    .gte("subscribed_at", day7Start.toISOString())
    .lte("subscribed_at", day7End.toISOString());

  for (const sub of day7Subs || []) {
    try {
      await sendDripDay7({ email: sub.email, name: sub.name, siteUrl });
      day7Sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    day3_sent: day3Sent,
    day7_sent: day7Sent,
    failed,
    run_at: now.toISOString(),
  });
}
