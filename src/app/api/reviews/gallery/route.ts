/**
 * GET /api/reviews/gallery
 *
 * Returns paginated approved reviews that have photos (photo_approved = true).
 * Joins with products for name/slug/category. Public — no auth required.
 *
 * Query params:
 *   ?page=1       — page number (default 1)
 *   ?limit=20     — items per page (default 20, max 50)
 *   ?category=slug — filter by product category slug
 *   ?min_rating=4  — minimum star rating filter
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category") || "";
    const minRating = parseInt(searchParams.get("min_rating") || "0", 10);
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query — only reviews with approved photos
    // Fetch user_id so we can show reviewer info; skip user_profiles join
    // since FK may not resolve via service role client
    let query = supabase
      .from("reviews")
      .select(
        `id, rating, title, body, images, verified_purchase, created_at, user_id,
         products!inner(name, slug, images, categories(slug, name))`,
        { count: "exact" }
      )
      .eq("approved", true)
      .eq("photo_approved", true)
      .not("images", "is", null)
      .order("created_at", { ascending: false });

    if (minRating > 0) {
      query = query.gte("rating", minRating);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Gallery query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by category on the JS side (Supabase nested filter limitation)
    let filtered = data || [];
    if (category) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((r: any) => {
        const cat = r.products?.categories;
        return cat?.slug === category;
      });
    }

    // Also filter out reviews with empty images arrays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered = filtered.filter((r: any) => r.images && r.images.length > 0);

    // Fetch user profile names for the filtered reviews
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = [...new Set(filtered.map((r: any) => r.user_id).filter(Boolean))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profileMap: Record<string, { first_name?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, first_name")
        .in("id", userIds);
      if (profiles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of profiles as any[]) {
          profileMap[p.id] = { first_name: p.first_name };
        }
      }
    }

    // Attach user_profiles to each review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = filtered.map((r: any) => ({
      ...r,
      user_profiles: profileMap[r.user_id] || null,
    }));

    return NextResponse.json({
      reviews: enriched,
      total: count || 0,
      page,
      limit,
      hasMore: offset + limit < (count || 0),
    });
  } catch (err) {
    console.error("Gallery API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
