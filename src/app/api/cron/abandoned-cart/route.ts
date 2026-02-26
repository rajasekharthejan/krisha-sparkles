import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAbandonedCart1hr, sendAbandonedCart24hr } from "@/lib/email";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Validate cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Suppress unused variable warning
  void oneDayAgo;

  let sent1hr = 0;
  let sent24hr = 0;

  // 1hr emails: updated between 1hr-30min ago and 1hr-0min ago (only where not sent)
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const { data: carts1hr } = await supabase
    .from("abandoned_cart_emails")
    .select("*")
    .eq("sent_1hr", false)
    .eq("recovered", false)
    .lte("updated_at", thirtyMinAgo)
    .gte("updated_at", oneHourAgo);

  for (const cart of carts1hr || []) {
    try {
      await sendAbandonedCart1hr({
        email: cart.email,
        cartSnapshot: cart.cart_snapshot,
      });
      await supabase
        .from("abandoned_cart_emails")
        .update({ sent_1hr: true })
        .eq("id", cart.id);
      sent1hr++;
    } catch (err) {
      console.error("Failed to send 1hr email:", err);
    }
  }

  // 24hr emails: updated between 25hr ago and 23hr ago (only where 1hr sent, 24hr not sent)
  const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
  const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
  const { data: carts24hr } = await supabase
    .from("abandoned_cart_emails")
    .select("*")
    .eq("sent_1hr", true)
    .eq("sent_24hr", false)
    .eq("recovered", false)
    .lte("updated_at", twentyThreeHoursAgo)
    .gte("updated_at", twentyFiveHoursAgo);

  for (const cart of carts24hr || []) {
    try {
      await sendAbandonedCart24hr({
        email: cart.email,
        cartSnapshot: cart.cart_snapshot,
      });
      await supabase
        .from("abandoned_cart_emails")
        .update({ sent_24hr: true })
        .eq("id", cart.id);
      sent24hr++;
    } catch (err) {
      console.error("Failed to send 24hr email:", err);
    }
  }

  return NextResponse.json({ success: true, sent1hr, sent24hr });
}
