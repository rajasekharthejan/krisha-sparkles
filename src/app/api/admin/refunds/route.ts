import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendRefundStatusEmail } from "@/lib/email";
import { sendWhatsAppRefundUpdate } from "@/lib/whatsapp-notify";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, admin_notes } = await req.json();
  if (!id || !["pending", "approved", "denied"].includes(status))
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("refund_requests")
    .update({ status, admin_notes: admin_notes?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Refund update error:", error);
    return NextResponse.json({ error: "Failed to update refund" }, { status: 500 });
  }

  // Send email + WhatsApp notification when status changes to approved or denied
  if (status === "approved" || status === "denied") {
    try {
      const { data: refund } = await supabase
        .from("refund_requests")
        .select("email, order_id")
        .eq("id", id)
        .single();
      if (refund) {
        // Email notification
        sendRefundStatusEmail({
          email: refund.email,
          orderId: refund.order_id,
          status,
          adminNotes: admin_notes?.trim() || null,
        }).catch(() => {});

        // WhatsApp notification (if customer opted in)
        try {
          const { data: order } = await supabase
            .from("orders")
            .select("id, notify_whatsapp, phone")
            .eq("id", refund.order_id)
            .single();
          if (order?.notify_whatsapp && order.phone) {
            sendWhatsAppRefundUpdate(
              order.phone,
              order.id.slice(-8).toUpperCase(),
              status as "approved" | "denied",
              admin_notes?.trim() || null,
              order.id,
            ).catch(() => {});
          }
        } catch { /* WhatsApp failure is non-blocking */ }
      }
    } catch { /* notification failure is non-blocking */ }
  }

  return NextResponse.json({ success: true });
}
