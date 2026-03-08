/**
 * GET /api/live-events/[slug]
 * Public — returns event detail with featured products.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("live_events")
    .select(
      `*, live_event_products(*, products(id, name, slug, price, compare_price, images, stock_quantity))`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Sort products by display_order
  if (data.live_event_products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.live_event_products.sort((a: any, b: any) => a.display_order - b.display_order);
  }

  return NextResponse.json({ event: data });
}
