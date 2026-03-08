import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import LiveListingClient from "./LiveListingClient";

export const metadata: Metadata = {
  title: "Live Shopping — Krisha Sparkles",
  description:
    "Join our live shopping events! Watch live, chat with us, and shop exclusive deals on jewelry.",
};

async function getLiveEvents() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("live_events")
      .select(
        "id, title, slug, description, thumbnail, status, discount_code, discount_label, scheduled_at, started_at, ended_at, created_at, updated_at"
      )
      .order("scheduled_at", { ascending: true, nullsFirst: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function LivePage() {
  const events = await getLiveEvents();
  return <LiveListingClient events={events} />;
}
