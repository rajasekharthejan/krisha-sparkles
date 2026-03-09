import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/admin/categories
 *  Returns all categories with product count, sorted by display_order. */
export async function GET() {
  const supabase = await createAdminClient();

  const [{ data: cats }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,icon,display_order").order("display_order"),
    supabase.from("products").select("category_id").eq("active", true),
  ]);

  // Build count map
  const countMap: Record<string, number> = {};
  for (const p of products || []) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  }

  const result = (cats || []).map((c) => ({ ...c, product_count: countMap[c.id] || 0 }));
  return NextResponse.json(result);
}

/** POST /api/admin/categories
 *  Batch-updates display_order for all categories.
 *  Body: [{id, display_order}] */
export async function POST(req: NextRequest) {
  const supabase = await createAdminClient();
  const body = await req.json();
  const updates: { id: string; display_order: number }[] = body;

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "Expected array of {id, display_order}" }, { status: 400 });
  }

  const errors: string[] = [];
  for (const { id, display_order } of updates) {
    const { error } = await supabase
      .from("categories")
      .update({ display_order })
      .eq("id", id);
    if (error) errors.push(`${id}: ${error.message}`);
  }

  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  return NextResponse.json({ ok: true });
}
