import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already has a referral code
    const { data: existing } = await admin
      .from("referrals")
      .select("coupon_code")
      .eq("referrer_id", user.id)
      .limit(1)
      .single();

    if (existing) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";
      return NextResponse.json({ code: existing.coupon_code, link: `${siteUrl}/ref/${existing.coupon_code}` });
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: collision } = await admin.from("referrals").select("id").eq("coupon_code", code).single();
      if (!collision) break;
      code = generateCode();
      attempts++;
    }

    const { error } = await admin.from("referrals").insert({
      referrer_id: user.id,
      referee_email: "",
      coupon_code: code,
      referrer_reward_credit: 5.00,
      status: "pending",
    });

    if (error) throw error;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";
    return NextResponse.json({ code, link: `${siteUrl}/ref/${code}` });
  } catch (err) {
    console.error("Generate referral error:", err);
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
  }
}
