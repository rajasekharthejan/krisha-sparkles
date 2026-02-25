import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const metadata = session.metadata;
      const itemsJson = metadata?.items ? JSON.parse(metadata.items) : [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionAny = session as any;
      const shippingAddr = sessionAny.shipping_details?.address ?? sessionAny.shipping?.address;
      const shipping_address = shippingAddr
        ? {
            line1: shippingAddr.line1 || "",
            line2: shippingAddr.line2 || "",
            city: shippingAddr.city || "",
            state: shippingAddr.state || "",
            postal_code: shippingAddr.postal_code || "",
            country: shippingAddr.country || "",
          }
        : null;

      const subtotal = (session.amount_subtotal || 0) / 100;
      const total = (session.amount_total || 0) / 100;
      const tax = (session.total_details?.amount_tax || 0) / 100;

      const supabaseAdmin = getSupabaseAdmin();

      // Extract user_id from metadata (empty string = guest)
      const userId = metadata?.user_id || null;

      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          email: session.customer_details?.email || "",
          name: session.customer_details?.name || "",
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || "",
          subtotal,
          tax,
          total,
          status: "paid",
          shipping_address,
          user_id: userId || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = lineItems.data.map((li, idx) => ({
        order_id: order.id,
        product_id: itemsJson[idx]?.productId || null,
        product_name: li.description || "",
        quantity: li.quantity || 1,
        price: (li.price?.unit_amount || 0) / 100,
      }));

      await supabaseAdmin.from("order_items").insert(orderItems);

      // Decrement stock
      for (const item of itemsJson) {
        if (item.productId) {
          const { data: prod } = await supabaseAdmin
            .from("products")
            .select("stock_quantity")
            .eq("id", item.productId)
            .single();

          if (prod) {
            const newQty = Math.max(0, prod.stock_quantity - item.quantity);
            await supabaseAdmin
              .from("products")
              .update({ stock_quantity: newQty })
              .eq("id", item.productId);
          }
        }
      }

      // Increment coupon usage count if a coupon was applied
      const couponId = metadata?.coupon_id;
      if (couponId) {
        try {
          const { data: coupon } = await supabaseAdmin
            .from("coupons")
            .select("uses_count")
            .eq("id", couponId)
            .single();
          if (coupon) {
            await supabaseAdmin
              .from("coupons")
              .update({ uses_count: coupon.uses_count + 1 })
              .eq("id", couponId);
          }
        } catch {
          console.error("Failed to increment coupon usage");
        }
      }

      console.log(`Order ${order.id} created for ${session.customer_details?.email}`);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
