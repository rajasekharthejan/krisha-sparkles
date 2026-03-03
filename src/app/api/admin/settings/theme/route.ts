import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const VALID_THEMES = ["dark", "pearl", "rose"] as const;

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

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "active_theme")
    .single();
  return NextResponse.json({ theme: data?.value || "dark" });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { theme } = await req.json();
  if (!VALID_THEMES.includes(theme)) {
    return NextResponse.json({ error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}` }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert({ key: "active_theme", value: theme, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, theme });
}
