/**
 * remove-bg.ts — Server-side background removal for product images
 *
 * Uses the remove.bg API (free tier: 50 images/month) to strip backgrounds
 * from mannequin product photos, producing transparent PNGs.
 * The transparent images are stored in Supabase Storage and referenced
 * in the `images_no_bg` column for AR Virtual Try-On.
 *
 * Env: REMOVE_BG_API_KEY — get one free at https://www.remove.bg/api
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const REMOVE_BG_API = "https://api.remove.bg/v1.0/removebg";

// Admin supabase client for storage uploads
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Remove background from a single image URL via remove.bg API.
 * Returns the public URL of the transparent PNG stored in Supabase, or null on failure.
 */
export async function removeBackground(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    console.warn("[remove-bg] REMOVE_BG_API_KEY not set — skipping background removal");
    return null;
  }

  try {
    // Call remove.bg API with the image URL
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "auto"); // free tier = preview res, paid = full res
    formData.append("format", "png");
    formData.append("type", "product"); // hint: product photography

    const res = await fetch(REMOVE_BG_API, {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error(`[remove-bg] API error ${res.status}: ${errText}`);

      // Log remaining credits
      const remaining = res.headers.get("X-Credits-Remaining");
      if (remaining) console.log(`[remove-bg] Credits remaining: ${remaining}`);

      return null;
    }

    // Log remaining credits for monitoring
    const remaining = res.headers.get("X-Credits-Remaining");
    if (remaining) console.log(`[remove-bg] Credits remaining: ${remaining}`);

    // Get PNG binary data
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      console.error("[remove-bg] Response too small — likely an error");
      return null;
    }

    // Upload transparent PNG to Supabase Storage
    const filename = `nobg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const supabase = getAdminClient();

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filename, buffer, {
        contentType: "image/png",
        cacheControl: "31536000", // 1 year cache — these don't change
        upsert: false,
      });

    if (uploadError) {
      console.error("[remove-bg] Supabase upload error:", uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    console.log(`[remove-bg] Success: ${filename}`);
    return urlData.publicUrl;
  } catch (err) {
    console.error("[remove-bg] Unexpected error:", err);
    return null;
  }
}

/**
 * Process all images for a single product.
 * Returns the array of transparent PNG URLs (parallel to product.images).
 * Empty string = that image failed processing.
 */
export async function processProductImages(productId: string): Promise<{
  success: boolean;
  images_no_bg: string[];
  processed: number;
  failed: number;
}> {
  const supabase = getAdminClient();

  // Fetch product images
  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("images, images_no_bg")
    .eq("id", productId)
    .single();

  if (fetchErr || !product?.images?.length) {
    return { success: false, images_no_bg: [], processed: 0, failed: 0 };
  }

  const existingNoBg: string[] = product.images_no_bg || [];
  const results: string[] = [];
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < product.images.length; i++) {
    // Skip if already processed (non-empty entry at this index)
    if (existingNoBg[i] && existingNoBg[i].length > 0) {
      results.push(existingNoBg[i]);
      continue;
    }

    const url = product.images[i];
    console.log(`[remove-bg] Processing image ${i + 1}/${product.images.length} for product ${productId}`);

    const nobgUrl = await removeBackground(url);
    if (nobgUrl) {
      results.push(nobgUrl);
      processed++;
    } else {
      results.push(""); // empty = not processed
      failed++;
    }
  }

  // Save to database
  const { error: updateErr } = await supabase
    .from("products")
    .update({ images_no_bg: results })
    .eq("id", productId);

  if (updateErr) {
    console.error("[remove-bg] DB update error:", updateErr.message);
    return { success: false, images_no_bg: results, processed, failed };
  }

  return { success: true, images_no_bg: results, processed, failed };
}
