/**
 * GET /api/admin/experiments/[id]/results
 *
 * Admin-only. Returns computed experiment results with chi-squared significance.
 * Uses get_experiment_results(exp_id) RPC function.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

/** Simple chi-squared test for 2x2 contingency table */
function chiSquaredTest(
  variants: { impressions: number; conversions: number }[],
): { chi_squared: number; p_value: number; significant: boolean } {
  if (variants.length < 2) {
    return { chi_squared: 0, p_value: 1, significant: false };
  }

  // Use first two variants for 2x2 chi-squared
  const [a, b] = variants;
  const n1 = Number(a.impressions);
  const n2 = Number(b.impressions);
  const c1 = Number(a.conversions);
  const c2 = Number(b.conversions);

  if (n1 === 0 || n2 === 0) {
    return { chi_squared: 0, p_value: 1, significant: false };
  }

  // 2x2 contingency table:
  // | Converted | Not Converted | Total
  // |    c1     |   n1 - c1     |  n1
  // |    c2     |   n2 - c2     |  n2
  const totalN = n1 + n2;
  const totalC = c1 + c2;
  const totalNC = totalN - totalC;

  if (totalC === 0 || totalNC === 0) {
    return { chi_squared: 0, p_value: 1, significant: false };
  }

  // Expected values
  const e11 = (n1 * totalC) / totalN;
  const e12 = (n1 * totalNC) / totalN;
  const e21 = (n2 * totalC) / totalN;
  const e22 = (n2 * totalNC) / totalN;

  // Chi-squared statistic
  const chi2 =
    ((c1 - e11) ** 2) / e11 +
    ((n1 - c1 - e12) ** 2) / e12 +
    ((c2 - e21) ** 2) / e21 +
    ((n2 - c2 - e22) ** 2) / e22;

  // p-value approximation for 1 degree of freedom
  // Using Wilson-Hilferty approximation
  let pValue: number;
  if (chi2 < 0.001) {
    pValue = 1;
  } else if (chi2 >= 10.828) {
    pValue = 0.001;
  } else if (chi2 >= 6.635) {
    pValue = 0.01;
  } else if (chi2 >= 3.841) {
    pValue = 0.05;
  } else if (chi2 >= 2.706) {
    pValue = 0.1;
  } else {
    pValue = 0.5;
  }

  return {
    chi_squared: Math.round(chi2 * 1000) / 1000,
    p_value: pValue,
    significant: pValue < 0.05,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: results, error } = await supabase.rpc("get_experiment_results", {
    exp_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const variants = (results || []).map((r: {
    variant_id: string;
    variant_name: string;
    is_control: boolean;
    impressions: number;
    conversions: number;
    conversion_rate: number;
    total_revenue: number;
  }) => ({
    variant_id: r.variant_id,
    variant_name: r.variant_name,
    is_control: r.is_control,
    impressions: Number(r.impressions),
    conversions: Number(r.conversions),
    conversion_rate: Number(r.conversion_rate),
    total_revenue: Number(r.total_revenue),
  }));

  // Compute chi-squared significance
  const stats = chiSquaredTest(variants);

  // Compute lift for non-control variants
  const control = variants.find((v: { is_control: boolean }) => v.is_control);
  const controlRate = control?.conversion_rate || 0;

  const variantsWithLift = variants.map((v: {
    variant_id: string;
    variant_name: string;
    is_control: boolean;
    impressions: number;
    conversions: number;
    conversion_rate: number;
    total_revenue: number;
  }) => ({
    ...v,
    lift: v.is_control
      ? 0
      : controlRate > 0
        ? Math.round(((v.conversion_rate - controlRate) / controlRate) * 100 * 10) / 10
        : 0,
  }));

  return NextResponse.json({
    experiment_id: id,
    variants: variantsWithLift,
    stats,
    total_impressions: variants.reduce((s: number, v: { impressions: number }) => s + v.impressions, 0),
    total_conversions: variants.reduce((s: number, v: { conversions: number }) => s + v.conversions, 0),
  });
}
