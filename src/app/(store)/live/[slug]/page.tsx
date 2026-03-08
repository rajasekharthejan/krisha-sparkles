import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import LiveEventClient from "./LiveEventClient";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("live_events")
    .select(
      `*, live_event_products(*, products(id, name, slug, price, compare_price, images, stock_quantity))`
    )
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event Not Found — Krisha Sparkles" };
  return {
    title: `${event.title} — Live Shopping | Krisha Sparkles`,
    description: event.description || `Join our live shopping event: ${event.title}`,
  };
}

export default async function LiveEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Sort products by display_order
  if (event.live_event_products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event.live_event_products.sort((a: any, b: any) => a.display_order - b.display_order);
  }

  return <LiveEventClient event={event} />;
}
