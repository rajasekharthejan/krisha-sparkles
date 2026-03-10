/**
 * POST /api/admin/products/remove-bg
 *
 * Admin-only endpoint to process product images through remove.bg API,
 * generating transparent PNGs for AR Virtual Try-On.
 *
 * Body:
 *   { productId: string }          — process one product
 *   { bulk: true }                 — process ALL active products with missing AR images
 *   { bulk: true, categorySlug: string } — process products in a specific category
 *
 * GET /api/admin/products/remove-bg?status=true
 *   Returns processing stats: total products, processed, pending
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { processProductImages } from "@/lib/remove-bg";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin() {
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
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

// ── GET: Status check ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasApiKey = !!process.env.REMOVE_BG_API_KEY;

  // Count products with/without AR images
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, images, images_no_bg")
    .eq("active", true);

  if (!products) {
    return NextResponse.json({ hasApiKey, total: 0, processed: 0, pending: 0 });
  }

  let processed = 0;
  let pending = 0;

  for (const p of products) {
    const imgs = p.images || [];
    const noBg = p.images_no_bg || [];
    // Product is "processed" if all images have a non-empty no-bg entry
    const allDone = imgs.length > 0 && imgs.every((_: string, i: number) => noBg[i] && noBg[i].length > 0);
    if (allDone) processed++;
    else pending++;
  }

  return NextResponse.json({
    hasApiKey,
    total: products.length,
    processed,
    pending,
  });
}

// ── POST: Process images ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.REMOVE_BG_API_KEY) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY not configured. Get a free key at https://www.remove.bg/api" },
      { status: 400 }
    );
  }

  let body: { productId?: string; bulk?: boolean; categorySlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Single product processing ───────────────────────────────────────────
  if (body.productId) {
    const result = await processProductImages(body.productId);
    return NextResponse.json(result);
  }

  // ── Bulk processing ─────────────────────────────────────────────────────
  if (body.bulk) {
    let query = supabaseAdmin
      .from("products")
      .select("id, images, images_no_bg, category_id, categories!inner(slug)")
      .eq("active", true);

    if (body.categorySlug) {
      query = supabaseAdmin
        .from("products")
        .select("id, images, images_no_bg, category_id, categories!inner(slug)")
        .eq("active", true)
        .eq("categories.slug", body.categorySlug);
    }

    const { data: products, error: fetchErr } = await query;
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!products?.length) {
      return NextResponse.json({ processed: 0, total: 0, message: "No products to process" });
    }

    // Filter to only products that need processing
    const needsProcessing = products.filter((p) => {
      const imgs = p.images || [];
      const noBg = p.images_no_bg || [];
      return imgs.length > 0 && !imgs.every((_: string, i: number) => noBg[i] && noBg[i].length > 0);
    });

    let totalProcessed = 0;
    let totalFailed = 0;
    const results: { productId: string; processed: number; failed: number }[] = [];

    for (const p of needsProcessing) {
      const result = await processProductImages(p.id);
      totalProcessed += result.processed;
      totalFailed += result.failed;
      results.push({ productId: p.id, processed: result.processed, failed: result.failed });
    }

    return NextResponse.json({
      success: true,
      products_processed: needsProcessing.length,
      images_processed: totalProcessed,
      images_failed: totalFailed,
      total_products: products.length,
      details: results,
    });
  }

  return NextResponse.json({ error: "Provide productId or bulk:true" }, { status: 400 });
}
