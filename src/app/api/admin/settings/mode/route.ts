import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getEnvStatus, type PaymentMode } from "@/lib/paymentMode";

const VALID_MODES: PaymentMode[] = ["test", "live"];

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

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "payment_mode")
    .single();

  return NextResponse.json({
    mode: (data?.value as PaymentMode) || "test",
    envStatus: getEnvStatus(),
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await req.json();
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate that the required env vars exist for the target mode
  const envStatus = getEnvStatus();

  if (mode === "live") {
    const missing: string[] = [];
    if (!envStatus.stripeLive) missing.push("STRIPE_SECRET_KEY_LIVE");
    if (!envStatus.stripeWebhookLive) missing.push("STRIPE_WEBHOOK_SECRET_LIVE");
    if (!envStatus.shippoLive) missing.push("SHIPPO_API_KEY_LIVE");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cannot switch to live mode. Missing env vars: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert(
      { key: "payment_mode", value: mode, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode, envStatus });
}
