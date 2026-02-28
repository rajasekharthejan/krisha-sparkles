import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

// Cache for 5 minutes — recommendations don't change by the second
export const revalidate = 300;

// Supabase returns plain objects; cast via unknown to satisfy TypeScript
type DbProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  images: string[];
  category_id?: string | null;
  stock_quantity: number;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compare_price: p.compare_price ?? undefined,
    images: p.images ?? [],
    category_id: p.category_id ?? undefined,
    stock_quantity: p.stock_quantity,
    featured: p.featured,
    active: p.active,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("product_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "4", 10), 12);

  if (!productId) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  // ── Tier 1: Co-purchase recommendations ────────────────────────────────
  // Step 1: find order_ids that contain this product
  const { data: orderRows } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId);

  let tier1Ids: string[] = [];
  let tier1Products: Product[] = [];

  if (orderRows && orderRows.length > 0) {
    const orderIds = [...new Set(orderRows.map((r) => r.order_id as string))];

    // Step 2: find other products bought in those same orders
    const { data: coItems } = await supabase
      .from("order_items")
      .select("product_id")
      .in("order_id", orderIds)
      .neq("product_id", productId)
      .not("product_id", "is", null);

    if (coItems && coItems.length > 0) {
      // Count frequency in JS, sort descending
      const freq: Record<string, number> = {};
      for (const row of coItems) {
        const pid = row.product_id as string | null;
        if (pid) freq[pid] = (freq[pid] ?? 0) + 1;
      }
      tier1Ids = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
    }
  }

  // Fetch full product records for tier-1 IDs, preserving frequency order
  if (tier1Ids.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select(
        "id, name, slug, price, compare_price, images, category_id, stock_quantity, featured, active, created_at, updated_at"
      )
      .in("id", tier1Ids)
      .eq("active", true);

    if (products) {
      const productMap = new Map(
        (products as DbProduct[]).map((p) => [p.id, toProduct(p)])
      );
      tier1Products = tier1Ids
        .map((id) => productMap.get(id))
        .filter((p): p is Product => p !== undefined);
    }
  }

  // ── Tier 2: Same-category fallback ────────────────────────────────────
  let recommendations: Product[] = [...tier1Products];

  if (recommendations.length < limit) {
    const needed = limit - recommendations.length;
    const excludeIds = [productId, ...tier1Ids];

    // Get current product's category_id
    const { data: currentProduct } = await supabase
      .from("products")
      .select("category_id")
      .eq("id", productId)
      .single();

    if (currentProduct?.category_id) {
      const { data: fallbackProducts } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, compare_price, images, category_id, stock_quantity, featured, active, created_at, updated_at"
        )
        .eq("category_id", currentProduct.category_id)
        .eq("active", true)
        .not("id", "in", `(${excludeIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(needed);

      if (fallbackProducts) {
        recommendations = [
          ...recommendations,
          ...(fallbackProducts as DbProduct[]).map(toProduct),
        ];
      }
    }
  }

  return NextResponse.json({ recommendations: recommendations.slice(0, limit) });
}
