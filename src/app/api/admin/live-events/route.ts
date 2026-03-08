/**
 * Admin Live Events CRUD
 * GET  — list all events (newest first)
 * POST — create or update an event
 * DELETE — delete an event by id
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = admin();
  const { data, error } = await supabase
    .from("live_events")
    .select("*, live_event_products(*, products(id, name, slug, price, images))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = admin();

  const {
    id,
    title,
    description,
    video_url,
    thumbnail,
    scheduled_at,
    discount_code,
    discount_label,
    products: eventProducts,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = slugify(title);

  if (id) {
    // ── UPDATE ──
    const { error } = await supabase
      .from("live_events")
      .update({
        title,
        slug,
        description: description || null,
        video_url: video_url || null,
        thumbnail: thumbnail || null,
        scheduled_at: scheduled_at || null,
        discount_code: discount_code || null,
        discount_label: discount_label || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Rebuild products
    if (Array.isArray(eventProducts)) {
      await supabase.from("live_event_products").delete().eq("event_id", id);
      if (eventProducts.length > 0) {
        const rows = eventProducts.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any, i: number) => ({
            event_id: id,
            product_id: p.product_id,
            display_order: i,
            special_price: p.special_price || null,
          })
        );
        await supabase.from("live_event_products").insert(rows);
      }
    }

    return NextResponse.json({ success: true });
  }

  // ── CREATE ──
  const { data, error } = await supabase
    .from("live_events")
    .insert({
      title,
      slug,
      description: description || null,
      video_url: video_url || null,
      thumbnail: thumbnail || null,
      scheduled_at: scheduled_at || null,
      discount_code: discount_code || null,
      discount_label: discount_label || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert products
  if (Array.isArray(eventProducts) && eventProducts.length > 0 && data) {
    const rows = eventProducts.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any, i: number) => ({
        event_id: data.id,
        product_id: p.product_id,
        display_order: i,
        special_price: p.special_price || null,
      })
    );
    await supabase.from("live_event_products").insert(rows);
  }

  return NextResponse.json({ success: true, id: data?.id });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = admin();
  const { error } = await supabase.from("live_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
