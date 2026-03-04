/**
 * SECURITY: Server-side admin authentication with brute-force protection.
 * - Rate limits to 5 attempts per IP per 15 minutes
 * - Logs every attempt (success + failure) to admin_login_attempts table
 * - Sets Supabase session cookies server-side
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { rateLimitAsync, getClientIp } from "@/lib/rateLimit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // ── Rate limit: 5 attempts / 15 min per IP (distributed via Upstash Redis) ──
  const rl = await rateLimitAsync(`admin-login:${ip}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterMs / 60_000);
    await logAttempt(ip, "", false, "Rate limited");
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${minutes} minute(s) before trying again.`,
        retryAfterMinutes: minutes,
      },
      { status: 429 }
    );
  }

  // ── Parse body ───────────────────────────────────────────────
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  // ── Build a server-side Supabase client that sets cookies ────
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ── Attempt sign-in ──────────────────────────────────────────
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await logAttempt(ip, email, false, error?.message ?? "Auth failed");
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // ── Admin role check ─────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  if (adminEmail && data.user.email !== adminEmail) {
    await logAttempt(ip, email, false, "Not admin email");
    // Sign them back out to avoid leaving a rogue session
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // ── Success ──────────────────────────────────────────────────
  await logAttempt(ip, email, true, "Login successful");
  // Cookies are already set on `response` via createServerClient
  return response;
}

async function logAttempt(
  ip: string,
  email: string,
  success: boolean,
  note: string
) {
  try {
    await supabaseAdmin.from("admin_login_attempts").insert({
      ip_address: ip,
      email_attempted: email,
      success,
      note,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Never fail the login because logging failed
  }
}
