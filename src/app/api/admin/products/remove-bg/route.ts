/**
 * POST /api/admin/products/remove-bg
 *
 * Admin-only. Processes ONE image at a time (Vercel 10s timeout safe).
 *
 * Body:
 *   { productId: string, imageIndex: number }  — process one image
 *
 * GET /api/admin/products/remove-bg
 *   Returns status + list of pending images to process.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { removeBackground } from "@/lib/remove-bg";

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

// ── GET: Status + pending list ────────────────────────────────────────────────
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasApiKey = !!process.env.REMOVE_BG_API_KEY;

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, name, images, images_no_bg")
    .eq("active", true);

  if (!products) {
    return NextResponse.json({ hasApiKey, total: 0, processed: 0, pending: 0, pendingImages: [] });
  }

  let processed = 0;
  let pending = 0;
  const pendingImages: { productId: string; productName: string; imageIndex: number; imageUrl: string }[] = [];

  for (const p of products) {
    const imgs: string[] = p.images || [];
    const noBg: string[] = p.images_no_bg || [];
    let productDone = true;

    for (let i = 0; i < imgs.length; i++) {
      if (!noBg[i] || noBg[i].length === 0) {
        productDone = false;
        pendingImages.push({
          productId: p.id,
          productName: p.name,
          imageIndex: i,
          imageUrl: imgs[i],
        });
      }
    }

    if (productDone && imgs.length > 0) processed++;
    else if (imgs.length > 0) pending++;
  }

  return NextResponse.json({
    hasApiKey,
    total: products.length,
    processed,
    pending,
    pendingImages,
  });
}

// ── POST: Process ONE image ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.REMOVE_BG_API_KEY) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY not configured. Get a free key at https://www.remove.bg/api" },
      { status: 400 }
    );
  }

  let body: { productId?: string; imageIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, imageIndex } = body;
  if (!productId || imageIndex === undefined || imageIndex === null) {
    return NextResponse.json({ error: "productId and imageIndex required" }, { status: 400 });
  }

  // Fetch product
  const { data: product, error: fetchErr } = await supabaseAdmin
    .from("products")
    .select("images, images_no_bg")
    .eq("id", productId)
    .single();

  if (fetchErr || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const images: string[] = product.images || [];
  if (imageIndex >= images.length) {
    return NextResponse.json({ error: "imageIndex out of range" }, { status: 400 });
  }

  // Already processed?
  const existingNoBg: string[] = product.images_no_bg || [];
  if (existingNoBg[imageIndex] && existingNoBg[imageIndex].length > 0) {
    return NextResponse.json({ success: true, alreadyDone: true, url: existingNoBg[imageIndex] });
  }

  // Process this single image via remove.bg
  const imageUrl = images[imageIndex];
  const nobgUrl = await removeBackground(imageUrl);

  if (!nobgUrl) {
    return NextResponse.json({ error: "Background removal failed for this image" }, { status: 500 });
  }

  // Update the images_no_bg array at this index
  const updatedNoBg = [...existingNoBg];
  // Pad array if needed
  while (updatedNoBg.length < images.length) {
    updatedNoBg.push("");
  }
  updatedNoBg[imageIndex] = nobgUrl;

  const { error: updateErr } = await supabaseAdmin
    .from("products")
    .update({ images_no_bg: updatedNoBg })
    .eq("id", productId);

  if (updateErr) {
    return NextResponse.json({ error: "DB update failed: " + updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: nobgUrl });
}
