import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

// Use fetch-based HTTP client (avoids Node.js TLS issues on Vercel edge network)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 0,
});
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode, discountAmount, notifyWhatsApp, whatsAppPhone, appliedCredit, pointsToRedeem, pointsDiscount } = await req.json();

    // Get logged-in user if any (optional — guest checkout still works)
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { userId = user.id; userEmail = user.email || null; }
    } catch { /* not logged in, that's fine */ }

    // Read UTM attribution cookie
    let utmData: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string } | null = null;
    try {
      const utmCookieStore = await cookies();
      const utmCookie = utmCookieStore.get("ks_utm");
      if (utmCookie?.value) {
        utmData = JSON.parse(decodeURIComponent(utmCookie.value));
      }
    } catch { /* ignore */ }

    // Read referral code cookie
    let referralCode: string | null = null;
    try {
      const refCookieStore = await cookies();
      const refCookie = refCookieStore.get("ks_referral_code");
      if (refCookie?.value) referralCode = refCookie.value;
    } catch { /* ignore */ }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate coupon server-side if provided
    let validatedCoupon: {
      id: string; code: string; discount_type: string; discount_value: number;
    } | null = null;
    let serverDiscount = 0;

    if (couponCode) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .single();

      if (coupon && coupon.active) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const isExhausted = coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses;
        if (!isExpired && !isExhausted) {
          validatedCoupon = coupon;
          const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
            sum + item.price * item.quantity, 0);
          serverDiscount = coupon.discount_type === "percentage"
            ? Math.round((subtotal * coupon.discount_value) / 100 * 100) / 100
            : Math.min(coupon.discount_value, subtotal);
        }
      }
    }

    const lineItems = items.map((item: {
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // If there's a validated discount, add it as a coupon line item (negative)
    // Note: Stripe Checkout doesn't support negative line items directly,
    // so we create an ad-hoc Stripe coupon instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: Record<string, any> = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 999, currency: "usd" },
            display_name: "Express shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
      ],
      success_url: `https://krisha-sparkles.vercel.app/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://krisha-sparkles.vercel.app/checkout?cancelled=true`,
      customer_email: userEmail || undefined,
      metadata: {
        items: JSON.stringify(
          items.map((i: { productId: string; quantity: number }) => ({
            productId: i.productId,
            quantity: i.quantity,
          }))
        ),
        user_id: userId || "",
        coupon_id: validatedCoupon?.id || "",
        coupon_code: validatedCoupon?.code || "",
        discount_amount: serverDiscount > 0 ? String(serverDiscount) : "",
        utm_source: utmData?.utm_source || "",
        utm_medium: utmData?.utm_medium || "",
        utm_campaign: utmData?.utm_campaign || "",
        utm_content: utmData?.utm_content || "",
        referral_code: referralCode || "",
        notify_whatsapp: notifyWhatsApp ? "true" : "false",
        phone: whatsAppPhone || "",
        applied_credit: appliedCredit ? String(appliedCredit) : "",
        // Loyalty points redemption metadata — webhook uses this to deduct from points_balance
        points_to_redeem: pointsToRedeem ? String(pointsToRedeem) : "",
        points_discount: pointsDiscount ? String(pointsDiscount) : "",
      },
    };

    // Apply loyalty points discount: add as a Stripe coupon (negative amount)
    // Points deduction from user_profiles happens in webhook after confirmed payment
    const resolvedPointsDiscount = pointsToRedeem && pointsDiscount ? Number(pointsDiscount) : 0;
    if (resolvedPointsDiscount > 0 && !sessionParams.discounts) {
      try {
        const loyaltyCoupon = await stripe.coupons.create({
          amount_off: Math.round(resolvedPointsDiscount * 100),
          currency: "usd",
          duration: "once",
          name: `${pointsToRedeem} Loyalty Points`,
        });
        sessionParams.discounts = [{ coupon: loyaltyCoupon.id }];
      } catch {
        console.log("Stripe loyalty coupon creation skipped");
      }
    }

    // Apply discount via Stripe coupon if we have a valid one
    if (validatedCoupon && serverDiscount > 0) {
      try {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(serverDiscount * 100),
          currency: "usd",
          duration: "once",
          name: `${validatedCoupon.code} discount`,
          metadata: { krisha_coupon_id: validatedCoupon.id },
        });
        sessionParams.discounts = [{ coupon: stripeCoupon.id }];
      } catch {
        // Stripe not fully configured — discount will still show in metadata
        // The order will note the coupon but discount won't be applied to Stripe total
        console.log("Stripe coupon creation skipped (keys not configured)");
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", errMsg);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
