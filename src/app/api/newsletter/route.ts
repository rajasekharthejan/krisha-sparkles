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

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedName = name?.trim() || null;

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, active")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    if (!existing.active) {
      await supabase.from("newsletter_subscribers").update({ active: true }).eq("id", existing.id);
      return NextResponse.json({ success: true, message: "Welcome back! You've been re-subscribed." });
    }
    return NextResponse.json({ success: true, message: "You're already subscribed!" });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: normalizedEmail,
    name: normalizedName,
  });

  if (error) return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });

  // Day 0 drip: send welcome email with WELCOME10 code — fire and forget
  sendWelcomeEmail({ email: normalizedEmail, name: normalizedName }).catch(() => {});

  return NextResponse.json({ success: true, message: "Successfully subscribed! Check your email for a welcome gift 🎁" });
}
