import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation, sendAdminOrderNotification } from "@/lib/email";
import { sendWhatsAppOrderConfirmation, notifyAdminNewOrder } from "@/lib/whatsapp-notify";

// Lazy Stripe init — avoids module-level evaluation at Next.js build time
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 0,
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
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
      const shippingAddr = sessionAny.shipping_details?.address
        ?? sessionAny.shipping?.address
        ?? sessionAny.collected_information?.shipping_details?.address;

      // Primary: address from Stripe session (if shipping_address_collection was used)
      // Fallback: address stored in metadata (when we collect address on our own page)
      let shipping_address: {
        line1: string; line2: string; city: string;
        state: string; postal_code: string; country: string;
      } | null = null;

      if (shippingAddr) {
        shipping_address = {
          line1: shippingAddr.line1 || "",
          line2: shippingAddr.line2 || "",
          city: shippingAddr.city || "",
          state: shippingAddr.state || "",
          postal_code: shippingAddr.postal_code || "",
          country: shippingAddr.country || "",
        };
      } else if (metadata?.shipping_address) {
        try {
          const parsed = JSON.parse(metadata.shipping_address);
          shipping_address = {
            line1: parsed.line1 || "",
            line2: parsed.line2 || "",
            city: parsed.city || "",
            state: parsed.state || "",
            postal_code: parsed.postal_code || "",
            country: parsed.country || "US",
          };
        } catch { /* ignore parse error */ }
      }

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
          coupon_code: metadata?.coupon_code || null,
          points_redeemed: metadata?.points_to_redeem ? parseInt(metadata.points_to_redeem, 10) : null,
          utm_source: metadata?.utm_source || null,
          utm_medium: metadata?.utm_medium || null,
          utm_campaign: metadata?.utm_campaign || null,
          utm_content: metadata?.utm_content || null,
          referral_code: metadata?.referral_code || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items — only the actual products (itemsJson.length entries).
      // Line items may also include tax and shipping rows added after the products,
      // so we slice to the number of products to avoid storing those as order items.
      const productLineItems = lineItems.data.slice(0, itemsJson.length);
      const orderItems = productLineItems.map((li, idx) => ({
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

      // Deduct redeemed loyalty points (must happen BEFORE awarding new points)
      const pointsToRedeem = metadata?.points_to_redeem ? parseInt(metadata.points_to_redeem, 10) : 0;
      if (userId && pointsToRedeem > 0) {
        try {
          // Direct update: subtract redeemed points from user_profiles.points_balance
          const { data: profileData } = await supabaseAdmin
            .from("user_profiles")
            .select("points_balance")
            .eq("id", userId)
            .single();
          if (profileData) {
            const newBalance = Math.max(0, (profileData.points_balance || 0) - pointsToRedeem);
            await supabaseAdmin
              .from("user_profiles")
              .update({ points_balance: newBalance })
              .eq("id", userId);
            // Also record points_redeemed on the order for history
            await supabaseAdmin
              .from("orders")
              .update({ points_redeemed: pointsToRedeem })
              .eq("id", order.id);
          }
        } catch {
          console.error("Failed to deduct loyalty points");
        }
      }

      // Award loyalty points: 1 point per $1 spent (integer floor, logged-in users only)
      if (userId) {
        try {
          const pts = Math.floor(total);
          if (pts > 0) {
            await supabaseAdmin.rpc("increment_points", { user_id: userId, pts });
          }
        } catch {
          console.error("Failed to award loyalty points");
        }
      }

      // Complete referral if applicable
      const referralCode = metadata?.referral_code;
      if (referralCode && userId) {
        try {
          // Only complete on first purchase for this user
          const { count } = await supabaseAdmin
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          
          if ((count || 0) <= 1) { // This is their first/only order
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com"}/api/referrals/complete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({
                referral_code: referralCode,
                referee_user_id: userId,
                referee_email: session.customer_details?.email || "",
              }),
            });
          }
        } catch {
          console.error("Failed to complete referral");
        }
      }

      // Save WhatsApp preferences on order and send notification
      if (metadata?.notify_whatsapp === "true" && metadata?.phone) {
        try {
          await supabaseAdmin.from("orders").update({
            notify_whatsapp: true,
            phone: metadata.phone,
          }).eq("id", order.id);
          
          // Send WhatsApp order confirmation (non-blocking)
          sendWhatsAppOrderConfirmation(
            metadata.phone,
            order.id.slice(-8).toUpperCase(),
            total
          ).catch(() => console.error("WhatsApp notification failed"));
        } catch {
          console.error("Failed to save WhatsApp preferences");
        }
      }

      // Await all emails before returning — fire-and-forget gets killed on Vercel serverless
      const orderWithItems = { ...order, order_items: orderItems.map((oi) => ({ ...oi, id: oi.order_id + oi.product_id })) };
      await Promise.allSettled([
        sendOrderConfirmation(orderWithItems).catch((e) =>
          console.error("Failed to send order confirmation email:", e)
        ),
        sendAdminOrderNotification(orderWithItems).catch((e) =>
          console.error("Failed to send admin order notification email:", e)
        ),
        notifyAdminNewOrder({
          orderRef: order.id.slice(-8).toUpperCase(),
          customerName: order.name,
          customerEmail: order.email,
          total,
          items: orderItems.map((oi) => ({ product_name: oi.product_name, quantity: oi.quantity, price: oi.price })),
          shippingCity: shipping_address?.city,
          shippingState: shipping_address?.state,
        }).catch((e) =>
          console.error("Failed to send admin WhatsApp notification:", e)
        ),
      ]);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
