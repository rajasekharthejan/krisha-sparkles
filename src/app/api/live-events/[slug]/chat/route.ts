/**
 * GET  /api/live-events/[slug]/chat — chat history (latest 100)
 * POST /api/live-events/[slug]/chat — send message (auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = admin();

  // Get event id from slug
  const { data: event } = await supabase
    .from("live_events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("live_event_messages")
    .select("id, user_name, message, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ messages: messages || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { message } = await req.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = admin();

  // Get event
  const { data: event } = await sb
    .from("live_events")
    .select("id, status")
    .eq("slug", slug)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get user profile name
  const { data: profile } = await sb
    .from("user_profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.first_name || user.email?.split("@")[0] || "User";

  const { error } = await sb.from("live_event_messages").insert({
    event_id: event.id,
    user_id: user.id,
    user_name: userName,
    message: message.trim().slice(0, 500), // limit message length
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
