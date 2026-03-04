import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripe = await getStripe();
  try {
    const {
      items, couponCode, discountAmount, notifyWhatsApp, whatsAppPhone,
      appliedCredit, pointsToRedeem, pointsDiscount,
      shippingState, taxAmount,
      // Customer-selected shipping — added as line item, not collected on Stripe page
      shippingCost, shippingMethod,
      shippingAddress,
    } = await req.json();

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

    // Add Texas sales tax as a line item if shipping to TX
    const resolvedTax = shippingState === "TX" && taxAmount > 0 ? Number(taxAmount) : 0;
    if (resolvedTax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Texas Sales Tax (8.25%)" },
          unit_amount: Math.round(resolvedTax * 100),
        },
        quantity: 1,
      });
    }

    // Add shipping cost as a line item (customer already chose method on our page)
    const resolvedShippingCost = shippingCost && Number(shippingCost) > 0 ? Number(shippingCost) : 0;
    if (resolvedShippingCost > 0) {
      const shippingLabel = shippingMethod === "express"
        ? "Express Shipping (2–4 business days)"
        : "Standard Shipping (5–10 business days)";
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: shippingLabel },
          unit_amount: Math.round(resolvedShippingCost * 100),
        },
        quantity: 1,
      });
    }

    // If there's a validated discount, add it as a coupon line item (negative)
    // Note: Stripe Checkout doesn't support negative line items directly,
    // so we create an ad-hoc Stripe coupon instead
    // Shipping address collected on our page — passed to Stripe as PI shipping data
    // This means Stripe does NOT re-collect the address (state is locked, tax is final)
    const resolvedShippingAddress = shippingAddress && shippingAddress.line1
      ? {
          name: shippingAddress.name || "",
          address: {
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || undefined,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zip,
            country: "US",
          },
        }
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: Record<string, any> = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      // Shipping address is collected on our checkout page — not re-asked on Stripe
      // payment_intent_data.shipping stores it on the PI for records and fraud signals
      ...(resolvedShippingAddress ? {
        payment_intent_data: {
          shipping: resolvedShippingAddress,
        },
      } : {}),
      success_url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com").trim()}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://shopkrisha.com").trim()}/checkout?cancelled=true`,
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
        shipping_state: shippingState || "",
        tax_amount: resolvedTax > 0 ? String(resolvedTax) : "",
        shipping_cost: resolvedShippingCost > 0 ? String(resolvedShippingCost) : "",
        shipping_method: shippingMethod || "free",
        // Full shipping address stored in metadata — webhook reads this for order record
        shipping_address: resolvedShippingAddress
          ? JSON.stringify({
              name: resolvedShippingAddress.name,
              line1: resolvedShippingAddress.address.line1,
              line2: resolvedShippingAddress.address.line2 || "",
              city: resolvedShippingAddress.address.city,
              state: resolvedShippingAddress.address.state,
              postal_code: resolvedShippingAddress.address.postal_code,
              country: "US",
            })
          : "",
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
