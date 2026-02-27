import { requireAuth } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import ReferralDashboard from "./ReferralDashboard";

export default async function ReferralsPage() {
  const user = await requireAuth();
  const supabase = await createAdminClient();

  // Get referrals
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, coupon_code, status, referee_email, referrer_reward_credit, created_at, completed_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  // Get store credits
  const { data: credits } = await supabase
    .from("store_credits")
    .select("id, amount, reason, used, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const availableCredit = (credits || []).filter(c => !c.used).reduce((sum, c) => sum + Number(c.amount), 0);
  const existingCode = referrals?.[0]?.coupon_code || null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com";

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <ReferralDashboard
          initialCode={existingCode}
          referrals={referrals || []}
          credits={credits || []}
          availableCredit={availableCredit}
          siteUrl={siteUrl}
        />
      </div>
    </div>
  );
}
