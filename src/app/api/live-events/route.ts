/**
 * GET /api/live-events
 * Public — returns live + upcoming + recent ended events.
 * No auth required.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all events — let client-side group by status
  const { data, error } = await supabase
    .from("live_events")
    .select("id, title, slug, description, video_url, thumbnail, status, discount_code, discount_label, scheduled_at, started_at, ended_at, created_at")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = data || [];

  // Separate by status
  const live = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");
  const ended = events.filter((e) => e.status === "ended").reverse(); // most recent first

  return NextResponse.json({ live, upcoming, ended });
}
