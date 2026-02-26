import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createAdminClient();
  
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("coupon_code", code.toUpperCase())
    .single();

  if (!referral) {
    redirect("/shop");
  }

  // Set referral cookie
  const cookieStore = await cookies();
  cookieStore.set("ks_referral_code", code.toUpperCase(), {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    httpOnly: false,
  });

  redirect("/shop?ref=1");
}
