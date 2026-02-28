/**
 * GET /api/feeds/tiktok-catalog
 *
 * Returns a JSON product catalog for TikTok Catalog API.
 * TikTok Catalog API uses specific field names.
 *
 * Cached for 1 hour (revalidate = 3600).
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

interface RawProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[];
  slug: string;
  categories?: { name: string }[] | { name: string } | null;
}

function getCategoryName(p: RawProduct): string {
  if (!p.categories) return "Jewelry";
  if (Array.isArray(p.categories)) return p.categories[0]?.name || "Jewelry";
  return p.categories.name || "Jewelry";
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, stock_quantity, images, slug, categories(name)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com").trim();

  const catalog = ((products as unknown as RawProduct[]) || []).map((p) => ({
    sku_id: p.id,
    title: p.name,
    description: p.description || p.name,
    price: `${Number(p.price).toFixed(2)} USD`,
    image_url: p.images?.[0] || "",
    product_url: `${siteUrl}/shop/${p.slug}`,
    available_for_sale: p.stock_quantity > 0,
    brand: "Krisha Sparkles",
    condition: "new",
    category: getCategoryName(p),
  }));

  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
