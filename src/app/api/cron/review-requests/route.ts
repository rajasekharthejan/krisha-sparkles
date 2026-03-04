import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReviewRequestEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // SECURITY: Fail-closed — reject if CRON_SECRET is missing or doesn't match
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await admin
    .from("orders")
    .select("id, email, name")
    .eq("status", "delivered")
    .lt("delivered_at", fiveDaysAgo)
    .eq("review_requested", false)
    .limit(50);

  if (!orders || orders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const order of orders) {
    try {
      await sendReviewRequestEmail({
        email: order.email,
        name: order.name,
        orderId: order.id,
      });
      await admin.from("orders").update({ review_requested: true }).eq("id", order.id);
      sent++;
    } catch {
      console.error(`Failed review request for order ${order.id.slice(-8)}`);
    }
  }

  return NextResponse.json({ sent });
}
