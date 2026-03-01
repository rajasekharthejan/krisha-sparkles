/**
 * Archive Orders API
 * POST /api/admin/orders/archive        — archive all (or filtered) orders
 * POST /api/admin/orders/archive?id=    — archive a single order
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get("id");
    const body = await req.json().catch(() => ({}));

    if (singleId) {
      // Archive single order
      const { error } = await supabase
        .from("orders")
        .update({ archived: true })
        .eq("id", singleId);
      if (error) throw error;
      return NextResponse.json({ success: true, archived: 1 });
    }

    // Archive all (or by status)
    const status: string | null = body.status || null;
    let updateQuery = supabase.from("orders").update({ archived: true }).eq("archived", false);
    if (status) updateQuery = updateQuery.eq("status", status);
    const { error: updateErr } = await updateQuery;
    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
