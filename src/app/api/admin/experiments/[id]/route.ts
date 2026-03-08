/**
 * Admin single experiment operations
 * GET   — Fetch single experiment with variants
 * PATCH — Change status (activate/pause/complete)
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("experiments")
    .select("*, experiment_variants(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["draft", "active", "paused", "completed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "active") {
    update.started_at = new Date().toISOString();
    update.ended_at = null;
  } else if (status === "completed") {
    update.ended_at = new Date().toISOString();
  }

  const { error } = await supabase.from("experiments").update(update).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
