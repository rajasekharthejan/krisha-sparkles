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

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const EASYPOST_KEY = process.env.EASYPOST_API_KEY;
  if (!EASYPOST_KEY) {
    return NextResponse.json({ error: "EASYPOST_API_KEY not configured" }, { status: 503 });
  }

  const { order_id, weight_oz, length, width, height, service } = await req.json();
  // weight_oz: weight in ounces, dimensions in inches, service: "FirstClass","Priority","ParcelSelect"

  const supabase = await createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (!order?.shipping_address) {
    return NextResponse.json({ error: "Order has no shipping address" }, { status: 400 });
  }

  const addr = order.shipping_address;
  const fromAddress = {
    name: "Krisha Sparkles",
    company: "Krisha Sparkles LLC",
    street1: process.env.STORE_ADDRESS_LINE1 || "123 Main St",
    city: process.env.STORE_ADDRESS_CITY || "New York",
    state: process.env.STORE_ADDRESS_STATE || "NY",
    zip: process.env.STORE_ADDRESS_ZIP || "10001",
    country: "US",
    phone: process.env.STORE_PHONE || "5555555555",
  };

  const toAddress = {
    name: order.name,
    street1: addr.line1,
    street2: addr.line2 || "",
    city: addr.city,
    state: addr.state,
    zip: addr.postal_code,
    country: addr.country || "US",
    email: order.email,
  };

  // Create shipment via EasyPost
  const shipmentRes = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(EASYPOST_KEY + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shipment: {
        from_address: fromAddress,
        to_address: toAddress,
        parcel: {
          weight: weight_oz,
          length: length || 10,
          width: width || 7,
          height: height || 2,
        },
        options: { label_format: "PDF" },
      },
    }),
  });

  if (!shipmentRes.ok) {
    const err = await shipmentRes.json();
    return NextResponse.json({ error: err?.error?.message || "Failed to create shipment" }, { status: 400 });
  }

  const shipment = await shipmentRes.json();

  // Find cheapest USPS rate for requested service
  const rates: Array<{ carrier: string; service: string; rate: string; id: string }> = shipment.rates || [];
  const uspsRates = rates.filter((r) => r.carrier === "USPS");
  const targetRate = service
    ? uspsRates.find((r) => r.service.includes(service)) || uspsRates[0]
    : uspsRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];

  if (!targetRate) {
    return NextResponse.json({ error: "No USPS rates available for this shipment", rates }, { status: 400 });
  }

  // Buy the label
  const buyRes = await fetch(`https://api.easypost.com/v2/shipments/${shipment.id}/buy`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(EASYPOST_KEY + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rate: { id: targetRate.id } }),
  });

  if (!buyRes.ok) {
    const err = await buyRes.json();
    return NextResponse.json({ error: err?.error?.message || "Failed to buy label" }, { status: 400 });
  }

  const bought = await buyRes.json();

  // Auto-save tracking number to the order
  const trackingNum = bought.tracking_code;
  if (trackingNum) {
    await supabase.from("orders").update({
      tracking_number: trackingNum,
      tracking_url: bought.tracker?.public_url || `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNum}`,
      status: "shipped",
      shipped_at: new Date().toISOString(),
    }).eq("id", order_id);
  }

  return NextResponse.json({
    success: true,
    label_url: bought.postage_label?.label_url,
    tracking_number: trackingNum,
    tracking_url: bought.tracker?.public_url,
    carrier: targetRate.carrier,
    service: targetRate.service,
    rate: targetRate.rate,
    shipment_id: shipment.id,
  });
}
