/**
 * POST /api/admin/shippo/rates
 * Creates a Shippo shipment for an order and returns available rates.
 *
 * Body: { order_id, weight_oz, length_in, width_in, height_in }
 * Returns: { rates: ShippoRate[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createShipment } from "@/lib/shippo";
import type { ShippoParcel, ShippoAddress } from "@/lib/shippo";

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
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { order_id, weight_oz = "8", length_in = "6", width_in = "4", height_in = "2" } = body;

  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  // Fetch order to get shipping address
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("id, name, email, shipping_address")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const addr = order.shipping_address as {
    line1?: string; line2?: string; city?: string;
    state?: string; postal_code?: string; country?: string;
  } | null;

  if (!addr?.line1 || !addr?.city || !addr?.state || !addr?.postal_code) {
    return NextResponse.json({ error: "Order has no complete shipping address" }, { status: 400 });
  }

  const toAddress: ShippoAddress = {
    name:    order.name,
    street1: addr.line1,
    street2: addr.line2 || undefined,
    city:    addr.city,
    state:   addr.state,
    zip:     addr.postal_code,
    country: addr.country || "US",
    email:   order.email,
    validate: false,
  };

  const parcel: ShippoParcel = {
    length:        String(length_in),
    width:         String(width_in),
    height:        String(height_in),
    distance_unit: "in",
    weight:        String(weight_oz),
    mass_unit:     "oz",
  };

  try {
    const rates = await createShipment(toAddress, parcel);

    // Sort by price ascending
    const sorted = rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

    return NextResponse.json({ rates: sorted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get rates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
