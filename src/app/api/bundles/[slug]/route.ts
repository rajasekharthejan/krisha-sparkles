import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — fetch a single active bundle by slug with bundle_items + products
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  return NextResponse.json({ bundle: data });
}
