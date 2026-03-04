import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

/** Regex-free email validation — immune to ReDoS */
function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string" || email.length < 3 || email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const domain = email.slice(at + 1);
  return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

/** Strip non-digits from phone; return null if fewer than 7 digits remain */
function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

/**
 * Generate a unique welcome coupon code like WLCM-4K2M-R7NX.
 * Uses unambiguous chars (no 0/O, I/1).
 */
function generateWelcomeCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand4 = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `WLCM-${rand4()}-${rand4()}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, phone } = body;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Phone is optional — if provided, enables anti-abuse check for coupon
  const cleanPhone = normalizePhone(phone);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedName  = name?.trim() || null;

  // ── Anti-abuse: one coupon per phone number (only if phone provided) ─────
  if (cleanPhone) {
    const { data: phoneExists } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, welcome_coupon_code")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (phoneExists) {
      // Phone already used — block regardless of email
      return NextResponse.json(
        { error: "A welcome coupon has already been generated for this phone number." },
        { status: 409 }
      );
    }
  }

  // ── Check if email already subscribed ────────────────────────────────────
  const { data: emailExists } = await supabase
    .from("newsletter_subscribers")
    .select("id, active, welcome_coupon_code")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emailExists) {
    if (!emailExists.active) {
      // Reactivate — add phone (if provided) and generate a new coupon
      const couponCode = generateWelcomeCouponCode();
      await insertCoupon(supabase, couponCode);
      await supabase
        .from("newsletter_subscribers")
        .update({ active: true, ...(cleanPhone ? { phone: cleanPhone } : {}), welcome_coupon_code: couponCode })
        .eq("id", emailExists.id);
      sendWelcomeEmail({ email: normalizedEmail, name: normalizedName, couponCode }).catch(() => {});
      return NextResponse.json({
        success: true,
        couponCode,
        message: "Welcome back! Your unique 10% off code has been sent to your email.",
      });
    }
    // Already active — don't issue a second coupon to this email
    return NextResponse.json(
      { error: "This email is already subscribed. Each email can only receive one welcome coupon." },
      { status: 409 }
    );
  }

  // ── New subscriber — generate unique coupon ───────────────────────────────
  const couponCode = generateWelcomeCouponCode();

  // Insert coupon into coupons table: 10% off, single-use, expires 30 days
  const couponError = await insertCoupon(supabase, couponCode);
  if (couponError) {
    return NextResponse.json({ error: "Failed to generate coupon" }, { status: 500 });
  }

  // Subscribe with optional phone + coupon code
  const { error: subError } = await supabase.from("newsletter_subscribers").insert({
    email: normalizedEmail,
    name:  normalizedName,
    ...(cleanPhone ? { phone: cleanPhone } : {}),
    welcome_coupon_code: couponCode,
  });

  if (subError) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }

  // Send welcome email with the unique code — fire and forget
  sendWelcomeEmail({ email: normalizedEmail, name: normalizedName, couponCode }).catch(() => {});

  return NextResponse.json({
    success: true,
    couponCode,
    message: "Your unique 10% off code has been sent to your email! 🎁",
  });
}

/** Insert a single-use 10% welcome coupon into the coupons table */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertCoupon(supabase: any, code: string): Promise<string | null> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const { error } = await supabase.from("coupons").insert({
    code,
    discount_type:  "percentage",
    discount_value: 10,
    max_uses:       1,
    uses_count:     0,
    active:         true,
    expires_at:     expiresAt,
    description:    "Welcome gift — 10% off first order (unique, single-use)",
    source:         "welcome",
    min_order_amount: 0,
  });
  return error?.message ?? null;
}
