import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_SUBJECTS = ["order_issue", "return_request", "product_question", "general", "other"];

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  if (!subject || !VALID_SUBJECTS.includes(subject))
    return NextResponse.json({ error: "Valid subject required" }, { status: 400 });
  if (!message?.trim() || message.trim().length < 10)
    return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("contact_messages").insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject,
    message: message.trim(),
  });

  if (error) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  return NextResponse.json({ success: true });
}
