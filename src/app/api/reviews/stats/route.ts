/**
 * GET /api/reviews/stats
 *
 * Returns review statistics (avg rating, count, breakdown) for products.
 *
 * Query params:
 *   ?product_id=UUID        — single product stats (full breakdown)
 *   ?product_ids=UUID,UUID   — batch stats for shop page (avg + count only)
 *
 * Public — no auth required. Reads only approved reviews.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get("product_id");
    const batchIds = searchParams.get("product_ids");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Single product: full breakdown ─────────────────────────
    if (singleId) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, images, photo_approved")
        .eq("product_id", singleId)
        .eq("approved", true);

      if (!reviews || reviews.length === 0) {
        return NextResponse.json({
          product_id: singleId,
          avg_rating: 0,
          review_count: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          photo_count: 0,
        });
      }

      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;
      let photoCount = 0;

      for (const r of reviews) {
        totalRating += r.rating;
        breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
        if (r.images && r.images.length > 0 && r.photo_approved !== false) {
          photoCount++;
        }
      }

      return NextResponse.json({
        product_id: singleId,
        avg_rating: Math.round((totalRating / reviews.length) * 10) / 10,
        review_count: reviews.length,
        breakdown,
        photo_count: photoCount,
      });
    }

    // ── Batch: multiple products (shop page) ───────────────────
    if (batchIds) {
      const ids = batchIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ stats: {} });
      }

      // Try RPC function first (more efficient)
      try {
        const { data: rpcData } = await supabase.rpc("get_review_stats", {
          p_product_ids: ids,
        });

        if (rpcData && rpcData.length > 0) {
          const stats: Record<string, { avg_rating: number; review_count: number }> = {};
          for (const row of rpcData) {
            stats[row.product_id] = {
              avg_rating: Math.round(Number(row.avg_rating) * 10) / 10,
              review_count: Number(row.review_count),
            };
          }
          return NextResponse.json({ stats });
        }
      } catch {
        // RPC not available — fall back to manual query
      }

      // Fallback: fetch all approved reviews for these products
      const { data: reviews } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .in("product_id", ids)
        .eq("approved", true);

      const stats: Record<string, { avg_rating: number; review_count: number }> = {};

      if (reviews) {
        const grouped: Record<string, number[]> = {};
        for (const r of reviews) {
          if (!grouped[r.product_id]) grouped[r.product_id] = [];
          grouped[r.product_id].push(r.rating);
        }
        for (const [pid, ratings] of Object.entries(grouped)) {
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          stats[pid] = {
            avg_rating: Math.round(avg * 10) / 10,
            review_count: ratings.length,
          };
        }
      }

      return NextResponse.json({ stats });
    }

    return NextResponse.json(
      { error: "Provide product_id or product_ids query param" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Review stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
