import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const SECTION_KEYS = [
  "hp_section_categories",
  "hp_section_occasion",
  "hp_section_instagram",
  "hp_section_newsletter",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** GET /api/admin/sections — returns {key: boolean} map */
export async function GET() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", [...SECTION_KEYS]);

  const map: Record<string, boolean> = {
    hp_section_categories: true,
    hp_section_occasion:   true,
    hp_section_instagram:  true,
    hp_section_newsletter: true,
  };
  for (const row of data || []) map[row.key] = row.value === "true";
  return NextResponse.json(map);
}

/** POST /api/admin/sections — body: {key: boolean} map, upserts into store_settings */
export async function POST(req: NextRequest) {
  const supabase = await createAdminClient();
  const body: Record<string, boolean> = await req.json();

  const upserts = Object.entries(body)
    .filter(([k]) => (SECTION_KEYS as readonly string[]).includes(k))
    .map(([key, val]) => ({ key, value: val ? "true" : "false" }));

  const { error } = await supabase
    .from("store_settings")
    .upsert(upserts, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
