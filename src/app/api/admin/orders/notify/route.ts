import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendShippingNotification } from "@/lib/email";

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

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id, type, custom_message } = await req.json();
  if (!order_id || !type) return NextResponse.json({ error: "Missing order_id or type" }, { status: 400 });

  const supabase = await createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", order_id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (type === "shipping_update") {
    await sendShippingNotification({
      email: order.email,
      name: order.name,
      orderId: order.id,
      trackingNumber: order.tracking_number || "N/A",
      trackingUrl: order.tracking_url,
    });
    return NextResponse.json({ success: true, message: "Shipping update email sent" });
  }

  if (type === "whatsapp") {
    const phone = custom_message;
    if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    const text = encodeURIComponent(
      `Hi ${order.name}! 👋 Your Krisha Sparkles order #${order.id.slice(-8).toUpperCase()} for $${order.total.toFixed(2)} is ${order.status}. ${order.tracking_number ? `Track it here: ${order.tracking_url || `https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}` : "We'll notify you when it ships!"} Thank you for shopping with us! ✨`
    );
    return NextResponse.json({ success: true, whatsapp_url: `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}` });
  }

  return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
}
