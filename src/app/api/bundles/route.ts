import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all active bundles with bundle_items + product details
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bundles")
    .select(
      `
      id,
      name,
      slug,
      description,
      image,
      bundle_price,
      compare_price,
      active,
      created_at,
      bundle_items (
        id,
        product_id,
        products (id, name, slug, price, compare_price, images, stock_quantity)
      )
    `
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bundles: data || [] });
}
