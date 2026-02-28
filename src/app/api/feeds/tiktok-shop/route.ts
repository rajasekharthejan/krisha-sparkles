/**
 * GET /api/feeds/tiktok-shop
 *
 * Returns a TSV (Tab-Separated Values) product feed for TikTok Shop.
 * TikTok Shop requires TSV format with specific column headers.
 *
 * Required columns per TikTok Shop spec:
 * id, title, description, availability, condition, price, link,
 * image_link, brand, google_product_category, custom_label_0
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
  category_id: string | null;
  categories?: { name: string }[] | { name: string } | null;
}

function getCategoryName(p: RawProduct): string {
  if (!p.categories) return "Jewelry";
  if (Array.isArray(p.categories)) return p.categories[0]?.name || "Jewelry";
  return p.categories.name || "Jewelry";
}

function escapeTSV(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, " ");
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, stock_quantity, images, slug, category_id, categories(name)")
    .eq("active", true)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com").trim();

  const headers = [
    "id", "title", "description", "availability", "condition",
    "price", "link", "image_link", "brand", "google_product_category", "custom_label_0"
  ].join("\t");

  const rows = ((products as unknown as RawProduct[]) || []).map((p) => {
    const categoryName = getCategoryName(p);
    const availability = p.stock_quantity > 0 ? "in stock" : "out of stock";
    const imageUrl = p.images?.[0] || "";
    const productUrl = `${siteUrl}/shop/${p.slug}`;

    // Google Product Category for jewelry/fashion
    const googleCategory = categoryName.toLowerCase().includes("dress")
      ? "Apparel & Accessories > Clothing > Dresses"
      : "Apparel & Accessories > Jewelry";

    return [
      escapeTSV(p.id),
      escapeTSV(p.name),
      escapeTSV(p.description || p.name),
      escapeTSV(availability),
      escapeTSV("new"),
      escapeTSV(`${Number(p.price).toFixed(2)} USD`),
      escapeTSV(productUrl),
      escapeTSV(imageUrl),
      escapeTSV("Krisha Sparkles"),
      escapeTSV(googleCategory),
      escapeTSV(categoryName),
    ].join("\t");
  });

  const tsv = [headers, ...rows].join("\n");

  return new NextResponse(tsv, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"tiktok-shop-feed.tsv\"",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
