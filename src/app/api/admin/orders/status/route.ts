import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  // Verify admin
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== "admin@krishasparkles.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order_id, status } = await req.json();
  if (!order_id || !status) {
    return NextResponse.json({ error: "Missing order_id or status" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", order_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
