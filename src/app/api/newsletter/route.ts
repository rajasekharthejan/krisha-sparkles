import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, active")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing) {
    if (!existing.active) {
      await supabase.from("newsletter_subscribers").update({ active: true }).eq("id", existing.id);
      return NextResponse.json({ success: true, message: "Welcome back! You've been re-subscribed." });
    }
    return NextResponse.json({ success: true, message: "You're already subscribed!" });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
  });

  if (error) return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  return NextResponse.json({ success: true, message: "Successfully subscribed!" });
}
