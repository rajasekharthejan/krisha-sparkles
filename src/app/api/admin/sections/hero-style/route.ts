import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Map hero style → hero_layout value
// "luxury" → "luxury", "classic" → "celestial" (default classic layout)
export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "hero_layout")
      .single();

    const layout = data?.value || "celestial";
    const style = layout === "luxury" ? "luxury" : "classic";
    return NextResponse.json({ style, layout });
  } catch {
    return NextResponse.json({ style: "classic", layout: "celestial" });
  }
}

export async function POST(req: Request) {
  try {
    const { style } = await req.json();
    if (!["classic", "luxury"].includes(style)) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // "luxury" → save layout as "luxury"
    // "classic" → restore to "celestial" (default classic)
    const layoutValue = style === "luxury" ? "luxury" : "celestial";

    await supabase
      .from("store_settings")
      .upsert({ key: "hero_layout", value: layoutValue }, { onConflict: "key" });

    return NextResponse.json({ ok: true, layout: layoutValue });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
