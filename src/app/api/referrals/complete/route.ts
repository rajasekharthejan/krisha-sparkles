import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Internal route — verify it's called from our own server via secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { referral_code, referee_user_id, referee_email } = await req.json();
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: referral } = await admin
      .from("referrals")
      .select("*")
      .eq("coupon_code", referral_code)
      .single();

    if (!referral || referral.status === "completed") {
      return NextResponse.json({ skipped: true });
    }

    // Mark referral completed
    await admin.from("referrals").update({
      status: "completed",
      referee_user_id,
      referee_email,
      completed_at: new Date().toISOString(),
    }).eq("id", referral.id);

    // Award store credit to referrer
    await admin.from("store_credits").insert({
      user_id: referral.referrer_id,
      amount: referral.referrer_reward_credit,
      reason: `Referral reward — ${referee_email} made a purchase`,
      used: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Complete referral error:", err);
    return NextResponse.json({ error: "Failed to complete referral" }, { status: 500 });
  }
}
