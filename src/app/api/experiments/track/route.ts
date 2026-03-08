/**
 * POST /api/experiments/track
 *
 * Public. Logs an experiment event (impression or conversion).
 * Body: { experiment_id, variant_id, event_type, session_id, revenue? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { experiment_id, variant_id, event_type, session_id, revenue } = body;

    if (!experiment_id || !variant_id || !event_type || !session_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["impression", "conversion"].includes(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // For impressions, deduplicate per session + experiment + variant
    if (event_type === "impression") {
      const { data: existing } = await supabase
        .from("experiment_events")
        .select("id")
        .eq("experiment_id", experiment_id)
        .eq("variant_id", variant_id)
        .eq("session_id", session_id)
        .eq("event_type", "impression")
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ success: true, deduplicated: true });
      }
    }

    const { error } = await supabase.from("experiment_events").insert({
      experiment_id,
      variant_id,
      event_type,
      session_id,
      revenue: revenue || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
