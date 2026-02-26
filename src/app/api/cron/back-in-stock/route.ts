/**
 * GET /api/cron/back-in-stock
 *
 * Cron job (hourly via vercel.json) that:
 * 1. Finds products that are back in stock (stock_quantity > 0) AND have pending
 *    back_in_stock_requests (notified = false).
 * 2. Sends a back-in-stock email to each subscriber.
 * 3. Marks each notified request as notified = true so they aren't emailed again.
 *
 * Protected by Bearer token (CRON_SECRET env var).
 * Run manually: GET /api/cron/back-in-stock with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBackInStockEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Auth guard — require CRON_SECRET bearer token
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all pending back-in-stock requests for products that are now in stock
  const { data: requests, error } = await admin
    .from("back_in_stock_requests")
    .select("id, email, product_id, products(id, name, slug, images)")
    .eq("notified", false)
    .filter("products.stock_quantity", "gt", 0);

  if (error) {
    console.error("Back-in-stock cron fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }

  // Filter to only requests where the related product is actually in stock
  // (the filter above may not work perfectly with joins, so double-check)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inStockRequests = (requests || []).filter((r: any) => {
    const prod = r.products as { stock_quantity?: number } | null | undefined;
    return prod != null && (prod.stock_quantity ?? 0) > 0;
  });

  if (inStockRequests.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending back-in-stock notifications" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krisha-sparkles.vercel.app";
  let notifiedCount = 0;
  const failedIds: string[] = [];

  for (const request of inStockRequests) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = request.products as any;
    const productUrl = `${siteUrl}/shop/${product.slug}`;
    const productImage = product.images?.[0] || "";

    try {
      await sendBackInStockEmail(
        request.email,
        product.name,
        productUrl,
        productImage
      );

      // Mark as notified
      await admin
        .from("back_in_stock_requests")
        .update({ notified: true })
        .eq("id", request.id);

      notifiedCount++;
    } catch (emailErr) {
      console.error(`Failed to send back-in-stock email to ${request.email}:`, emailErr);
      failedIds.push(request.id);
    }
  }

  console.log(`Back-in-stock cron: notified ${notifiedCount}, failed ${failedIds.length}`);
  return NextResponse.json({
    processed: notifiedCount,
    failed: failedIds.length,
    total_pending: inStockRequests.length,
  });
}
