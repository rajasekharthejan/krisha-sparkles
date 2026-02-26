/**
 * POST /api/back-in-stock/subscribe
 *
 * Subscribes an email address to be notified when a product is back in stock.
 * Rate limited: 1 subscription per product/email pair (UNIQUE constraint in DB).
 *
 * Body: { product_id: string, email: string }
 * Returns:
 *   200 — { success: true, message: "We'll notify you!" }
 *   409 — { error: "Already subscribed" } (duplicate)
 *   400 — { error: "..." } (missing fields / invalid email)
 *   500 — Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { product_id, email } = await req.json();

    if (!product_id || !email) {
      return NextResponse.json({ error: "product_id and email are required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Try to get logged-in user (optional — guests can also subscribe)
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch { /* guest checkout, ignore */ }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify product exists and is actually out of stock
    const { data: product } = await admin
      .from("products")
      .select("id, name, stock_quantity")
      .eq("id", product_id)
      .eq("active", true)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If back in stock already, no need to subscribe
    if (product.stock_quantity > 0) {
      return NextResponse.json({ error: "Product is already in stock!" }, { status: 400 });
    }

    // Insert — the UNIQUE(product_id, email) constraint handles deduplication
    const { error: insertError } = await admin
      .from("back_in_stock_requests")
      .insert({
        product_id,
        email: email.toLowerCase().trim(),
        user_id: userId,
        notified: false,
      });

    if (insertError) {
      // PostgreSQL unique violation = already subscribed
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "You're already on the waitlist for this product!" }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `We'll email you at ${email} when ${product.name} is back in stock!`,
    });
  } catch (err) {
    console.error("Back-in-stock subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}
