import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const VALID_LAYOUTS = ["celestial", "split", "minimal", "diagonal", "framed"] as const;

const HERO_KEYS = [
  "hero_layout", "hero_heading", "hero_subtext", "hero_badge",
  "hero_cta_primary_text", "hero_cta_primary_url",
  "hero_cta_secondary_text", "hero_cta_secondary_url",
] as const;

const DEFAULTS: Record<string, string> = {
  hero_layout: "celestial",
  hero_heading: "Adorned in *Gold*, Crafted with *Love*",
  hero_subtext: "Discover our exclusive collection of imitation jewelry & ethnic wear — inspired by Indian tradition, designed for the modern woman.",
  hero_badge: "Handpicked Imitation Jewelry",
  hero_cta_primary_text: "Shop Collection",
  hero_cta_primary_url: "/shop",
  hero_cta_secondary_text: "Instagram",
  hero_cta_secondary_url: "https://www.instagram.com/krisha_sparkles/",
};

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
    .select("key, value")
    .in("key", [...HERO_KEYS]);

  const map: Record<string, string> = {};
  for (const row of data || []) map[row.key] = row.value;

  return NextResponse.json({
    layout: map.hero_layout || DEFAULTS.hero_layout,
    heading: map.hero_heading || DEFAULTS.hero_heading,
    subtext: map.hero_subtext || DEFAULTS.hero_subtext,
    badge: map.hero_badge || DEFAULTS.hero_badge,
    ctaPrimaryText: map.hero_cta_primary_text || DEFAULTS.hero_cta_primary_text,
    ctaPrimaryUrl: map.hero_cta_primary_url || DEFAULTS.hero_cta_primary_url,
    ctaSecondaryText: map.hero_cta_secondary_text || DEFAULTS.hero_cta_secondary_text,
    ctaSecondaryUrl: map.hero_cta_secondary_url || DEFAULTS.hero_cta_secondary_url,
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: { key: string; value: string; updated_at: string }[] = [];
  const now = new Date().toISOString();

  // Validate layout
  if (body.layout !== undefined) {
    if (!VALID_LAYOUTS.includes(body.layout)) {
      return NextResponse.json({ error: `Invalid layout. Must be one of: ${VALID_LAYOUTS.join(", ")}` }, { status: 400 });
    }
    updates.push({ key: "hero_layout", value: body.layout, updated_at: now });
  }

  // Validate text fields
  const textFields: [string, string][] = [
    ["heading", "hero_heading"],
    ["subtext", "hero_subtext"],
    ["badge", "hero_badge"],
    ["ctaPrimaryText", "hero_cta_primary_text"],
    ["ctaSecondaryText", "hero_cta_secondary_text"],
  ];
  for (const [bodyKey, dbKey] of textFields) {
    if (body[bodyKey] !== undefined) {
      if (typeof body[bodyKey] !== "string" || body[bodyKey].length > 500) {
        return NextResponse.json({ error: `${bodyKey} must be a string under 500 chars` }, { status: 400 });
      }
      updates.push({ key: dbKey, value: body[bodyKey].trim(), updated_at: now });
    }
  }

  // Validate URL fields
  const urlFields: [string, string][] = [
    ["ctaPrimaryUrl", "hero_cta_primary_url"],
    ["ctaSecondaryUrl", "hero_cta_secondary_url"],
  ];
  for (const [bodyKey, dbKey] of urlFields) {
    if (body[bodyKey] !== undefined) {
      if (typeof body[bodyKey] !== "string" || (!body[bodyKey].startsWith("/") && !body[bodyKey].startsWith("https://"))) {
        return NextResponse.json({ error: `${bodyKey} must start with / or https://` }, { status: 400 });
      }
      updates.push({ key: dbKey, value: body[bodyKey].trim(), updated_at: now });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: updates.map((u) => u.key) });
}
