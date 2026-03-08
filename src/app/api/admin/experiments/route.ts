/**
 * Admin experiments CRUD
 * GET  — List all experiments with variants
 * POST — Create or update experiment + variants
 * DELETE — Remove experiment by id
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { slugify } from "@/lib/utils";

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

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("experiments")
    .select("*, experiment_variants(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ experiments: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    id,
    name,
    description,
    target_page = "/",
    target_component = "hero_section",
    traffic_pct = 100,
    variants = [],
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const slug = body.slug || slugify(name);

  if (id) {
    // Update existing experiment
    const { error: updateError } = await supabase
      .from("experiments")
      .update({
        name: name.trim(),
        slug,
        description: description || null,
        target_page,
        target_component,
        traffic_pct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Rebuild variants — delete old, insert new
    await supabase.from("experiment_variants").delete().eq("experiment_id", id);

    if (variants.length > 0) {
      const variantRows = variants.map((v: { name: string; weight: number; config: Record<string, unknown>; is_control: boolean }) => ({
        experiment_id: id,
        name: v.name,
        weight: v.weight || 50,
        config: v.config || {},
        is_control: v.is_control || false,
      }));
      await supabase.from("experiment_variants").insert(variantRows);
    }

    return NextResponse.json({ success: true, id });
  } else {
    // Create new experiment
    const { data: newExp, error: insertError } = await supabase
      .from("experiments")
      .insert({
        name: name.trim(),
        slug,
        description: description || null,
        status: "draft",
        target_page,
        target_component,
        traffic_pct,
        created_by: user.email || "admin",
      })
      .select("id")
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Insert variants
    if (variants.length > 0) {
      const variantRows = variants.map((v: { name: string; weight: number; config: Record<string, unknown>; is_control: boolean }) => ({
        experiment_id: newExp.id,
        name: v.name,
        weight: v.weight || 50,
        config: v.config || {},
        is_control: v.is_control || false,
      }));
      await supabase.from("experiment_variants").insert(variantRows);
    }

    return NextResponse.json({ success: true, id: newExp.id });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const supabase = await createAdminClient();
  const { error } = await supabase.from("experiments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
