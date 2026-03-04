/**
 * POST /api/admin/newsletter/send
 *
 * Admin-only. Sends a bulk email campaign to active newsletter subscribers.
 *
 * Body: { subject, preview_text?, html_body, segment }
 * segment: "all" | "buyers" | "non-buyers"
 *
 * Resend rate limits: 10 req/s, 100 emails/req (we use 50/batch for safety).
 * Batches are sent with a 1.2s delay between each to respect rate limits.
 *
 * All emails include a List-Unsubscribe header and footer link (CAN-SPAM).
 * Campaign is logged to email_campaigns table after send.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { buildUnsubscribeUrl } from "@/app/api/unsubscribe/route";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1200; // 1.2s between batches — stays under 10 req/s

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  // SECURITY: Cookie-based admin session auth (matches proxy's 3-layer security)
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { subject, preview_text, html_body, segment = "all" } = body;

  if (!subject?.trim() || !html_body?.trim()) {
    return NextResponse.json({ error: "subject and html_body required" }, { status: 400 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 503 });
  }

  const FROM = process.env.RESEND_FROM_EMAIL || "noreply@shopkrisha.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";

  // ── Fetch subscribers ────────────────────────────────────────────────────
  let subscriberQuery = supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("active", true);

  if (segment === "buyers") {
    // Active subscribers who also have at least one order
    const { data: buyerEmails } = await supabase
      .from("orders")
      .select("email")
      .not("email", "is", null);
    const emails = [...new Set((buyerEmails || []).map((o: { email: string }) => o.email))];
    subscriberQuery = subscriberQuery.in("email", emails);
  } else if (segment === "non-buyers") {
    const { data: buyerEmails } = await supabase
      .from("orders")
      .select("email")
      .not("email", "is", null);
    const emails = [...new Set((buyerEmails || []).map((o: { email: string }) => o.email))];
    if (emails.length > 0) {
      subscriberQuery = subscriberQuery.not("email", "in", `(${emails.map(e => `"${e}"`).join(",")})`);
    }
  }

  const { data: subscribers, error: subError } = await subscriberQuery;
  if (subError) {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }

  const list = subscribers || [];
  if (list.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: "No active subscribers in segment" });
  }

  // ── Send in batches ──────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (sub: { email: string; name: string | null }) => {
        const unsubUrl = buildUnsubscribeUrl(sub.email);
        const personalizedHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f5f5f5;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px;">
    <p style="font-size:28px;font-weight:700;color:#c9a84c;margin:0;">✦ Krisha Sparkles</p>
    <p style="color:#888;margin:8px 0 0;font-size:13px;">Exquisite Imitation Jewelry</p>
  </div>
  <!-- Body -->
  ${html_body}
  <!-- Footer -->
  <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05);margin-top:32px;">
    <a href="${siteUrl}/shop" style="display:inline-block;padding:12px 28px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-bottom:16px;">Shop Now →</a>
    <p style="color:#444;font-size:11px;margin:8px 0 4px;">© 2025 Krisha Sparkles LLC · Texas, USA</p>
    <p style="color:#333;font-size:10px;margin:0;">
      You received this because you subscribed to our newsletter.<br>
      <a href="${unsubUrl}" style="color:#555;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`;

        return resend.emails.send({
          from: `Krisha Sparkles <${FROM}>`,
          to: sub.email,
          subject,
          html: personalizedHtml,
          headers: {
            "List-Unsubscribe": `<${unsubUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            ...(preview_text ? { "X-Preview-Text": preview_text } : {}),
          },
        });
      })
    );

    sent += results.filter((r) => r.status === "fulfilled").length;
    failed += results.filter((r) => r.status === "rejected").length;

    // Delay between batches (skip for last batch)
    if (i + BATCH_SIZE < list.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // ── Log campaign ─────────────────────────────────────────────────────────
  await supabase.from("email_campaigns").insert({
    subject,
    preview_text: preview_text || null,
    html_body,
    segment,
    recipient_count: sent,
    created_by: user.email || "admin",
  });

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: list.length,
    message: `Campaign sent to ${sent} subscriber${sent !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
  });
}
