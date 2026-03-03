import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const SETTING_KEYS = ["free_shipping_threshold", "standard_shipping_rate", "express_shipping_rate"] as const;
type SettingKey = typeof SETTING_KEYS[number];

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
    // Match proxy.ts — trust anyone with a valid session who passed the gate cookie check
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
    return user.email === adminEmail;
  } catch {
    return false;
  }
}

// GET — fetch current shipping settings
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value, description, updated_at")
    .in("key", SETTING_KEYS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data || [] });
}

// POST — upsert one or more shipping settings
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const updates: { key: SettingKey; value: string; updated_at: string }[] = [];

  for (const key of SETTING_KEYS) {
    if (body[key] !== undefined) {
      const num = parseFloat(body[key]);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: `Invalid value for ${key}: must be a non-negative number` },
          { status: 400 }
        );
      }
      updates.push({ key, value: String(num), updated_at: now });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("store_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: updates.map(u => u.key) });
}
