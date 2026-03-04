import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { sendShippingNotification } from "@/lib/email";
import { sendWhatsAppShippingUpdate } from "@/lib/whatsapp-notify";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id, tracking_number, tracking_url } = await req.json();
  if (!order_id || !tracking_number?.trim())
    return NextResponse.json({ error: "order_id and tracking_number required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("orders")
    .update({
      tracking_number: tracking_number.trim(),
      tracking_url: tracking_url?.trim() || null,
      shipped_at: new Date().toISOString(),
      status: "shipped",
    })
    .eq("id", order_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send shipping notification email (non-blocking)
  if (data) {
    sendShippingNotification({
      email: data.email,
      name: data.name,
      orderId: data.id,
      trackingNumber: tracking_number.trim(),
      trackingUrl: tracking_url?.trim() || null,
    }).catch(() => {});

    // Send WhatsApp shipping update if opted in (non-blocking)
    if (data.notify_whatsapp && data.phone) {
      sendWhatsAppShippingUpdate(
        data.phone,
        data.id.slice(-8).toUpperCase(),
        tracking_number.trim(),
        data.id
      ).catch(() => console.error("WhatsApp shipping update failed"));
    }
  }

  return NextResponse.json({ success: true, order: data });
}
