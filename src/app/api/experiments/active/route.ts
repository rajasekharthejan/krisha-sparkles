/**
 * GET /api/experiments/active
 *
 * Public. Returns all active experiments with their variants.
 * Used by client-side useExperiment() hook for bucketing.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("experiments")
    .select("id, name, slug, target_page, target_component, traffic_pct, experiment_variants(id, name, weight, config, is_control)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ experiments: [] });
  }

  return NextResponse.json({ experiments: data || [] });
}
