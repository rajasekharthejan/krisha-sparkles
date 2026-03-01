/**
 * POST /api/admin/shippo/label
 * Purchases a shipping label from Shippo, saves tracking number + label URL to order.
 *
 * Body: { order_id, rate_id }
 * Returns: { tracking_number, tracking_url, label_url }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { purchaseLabel } from "@/lib/shippo";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@krishasparkles.com";
  return user?.email === adminEmail ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id, rate_id } = await req.json();
  if (!order_id || !rate_id) {
    return NextResponse.json({ error: "order_id and rate_id are required" }, { status: 400 });
  }

  try {
    const transaction = await purchaseLabel(rate_id);

    if (transaction.status !== "SUCCESS") {
      const msg = transaction.messages?.map((m) => m.text).join("; ") || "Label purchase failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Save to order: tracking_number, tracking_url, label_url, status → shipped
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        tracking_number: transaction.tracking_number,
        tracking_url:    transaction.tracking_url_provider,
        label_url:       transaction.label_url,
        status:          "shipped",
        shipped_at:      new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateErr) {
      console.error("Failed to update order after label purchase:", updateErr);
      // Don't fail — label was purchased, just return the data
    }

    return NextResponse.json({
      tracking_number: transaction.tracking_number,
      tracking_url:    transaction.tracking_url_provider,
      label_url:       transaction.label_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to purchase label";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
