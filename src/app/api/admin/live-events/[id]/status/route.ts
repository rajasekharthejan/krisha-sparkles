/**
 * PATCH /api/admin/live-events/[id]/status
 * Body: { status: "live" | "ended" }
 * Updates event status + sets started_at / ended_at timestamps.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  if (!["live", "ended", "scheduled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { status, updated_at: new Date().toISOString() };

  if (status === "live") {
    update.started_at = new Date().toISOString();
    update.ended_at = null;
  } else if (status === "ended") {
    update.ended_at = new Date().toISOString();
  }

  const { error } = await supabase.from("live_events").update(update).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
