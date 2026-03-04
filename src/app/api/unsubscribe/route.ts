/**
 * GET /api/unsubscribe?email=user@example.com&token=<hmac>&t=<timestamp>
 *
 * One-click unsubscribe endpoint — CAN-SPAM / RFC 8058 compliant.
 * Token is HMAC-SHA256(email + "|" + timestamp, UNSUBSCRIBE_SECRET) encoded as hex.
 * Tokens expire after 90 days for security.
 *
 * For backward compatibility, tokens without timestamp are also accepted
 * (legacy format: HMAC of just the email).
 */

import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const TOKEN_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function getSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "krisha-sparkles-unsub-fallback"
  );
}

/**
 * Build a time-limited unsubscribe token.
 * Includes timestamp in HMAC input so tokens expire.
 */
export function buildUnsubscribeToken(email: string, timestamp?: number): string {
  const ts = timestamp ?? Date.now();
  return createHmac("sha256", getSecret())
    .update(`${email.toLowerCase().trim()}|${ts}`)
    .digest("hex");
}

/** Legacy token (no timestamp) — for backward compatibility */
function buildLegacyToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(email.toLowerCase().trim())
    .digest("hex");
}

export function buildUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";
  const ts = Date.now();
  const token = buildUnsubscribeToken(email, ts);
  return `${base}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}&t=${ts}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function confirmationHtml(email: string, success: boolean) {
  const safeEmail = escapeHtml(email);
  const message = success
    ? `<strong style="color:#10b981">${safeEmail}</strong> has been unsubscribed. You won't receive marketing emails from us.`
    : `Something went wrong. Please email us at <a href="mailto:hello@shopkrisha.com" style="color:#c9a84c;">hello@shopkrisha.com</a> to unsubscribe.`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — Krisha Sparkles</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f5f5f5;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:480px;margin:auto;padding:2.5rem 1.5rem;text-align:center;">
    <p style="font-size:26px;font-weight:700;color:#c9a84c;margin:0 0 0.5rem;">✦ Krisha Sparkles</p>
    <p style="color:#666;font-size:13px;margin:0 0 2rem;">Exquisite Imitation Jewelry</p>
    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:2rem;">
      <p style="font-size:36px;margin:0 0 1rem;">${success ? "✅" : "⚠️"}</p>
      <h1 style="font-size:1.3rem;color:${success ? "#10b981" : "#f59e0b"};margin:0 0 1rem;">${success ? "Successfully Unsubscribed" : "Unsubscribe Failed"}</h1>
      <p style="color:#aaa;font-size:0.9rem;line-height:1.7;margin:0 0 1.5rem;">${message}</p>
      <a href="https://shopkrisha.com/shop" style="display:inline-block;padding:10px 24px;border:1px solid rgba(201,168,76,0.4);color:#c9a84c;text-decoration:none;border-radius:8px;font-size:14px;">
        Continue Shopping →
      </a>
    </div>
    <p style="color:#444;font-size:11px;margin-top:1.5rem;">© 2025 Krisha Sparkles LLC · Texas, USA</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  const token = searchParams.get("token");
  const timestampStr = searchParams.get("t");

  if (!email || !token) {
    return new NextResponse(confirmationHtml("", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Verify HMAC token — support both timestamped (new) and legacy (old) formats
  let valid = false;

  if (timestampStr) {
    // New format: token includes timestamp
    const ts = parseInt(timestampStr, 10);
    if (!isNaN(ts)) {
      // Check expiry — reject tokens older than 90 days
      if (Date.now() - ts > TOKEN_MAX_AGE_MS) {
        return new NextResponse(confirmationHtml(email, false), {
          status: 403,
          headers: { "Content-Type": "text/html" },
        });
      }
      const expected = buildUnsubscribeToken(email, ts);
      valid = token === expected;
    }
  }

  if (!valid) {
    // Fallback: try legacy token (no timestamp)
    const legacyExpected = buildLegacyToken(email);
    valid = token === legacyExpected;
  }

  if (!valid) {
    return new NextResponse(confirmationHtml(email, false), {
      status: 403,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Mark subscriber as inactive
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from("newsletter_subscribers")
      .update({ active: false })
      .eq("email", email);

    return new NextResponse(confirmationHtml(email, true), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new NextResponse(confirmationHtml(email, false), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
