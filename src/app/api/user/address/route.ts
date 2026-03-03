import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — fetch saved default address for current user
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ address: null });

  const supabase = getAdminClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("default_address")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ address: data?.default_address || null });
}

// POST — save/update default address for current user
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, addressLine1, addressLine2, city, state, zipCode } = body;

  if (!firstName || !lastName || !addressLine1 || !city || !state || !zipCode) {
    return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
  }

  const address = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    addressLine1: addressLine1.trim(),
    addressLine2: (addressLine2 || "").trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode.trim(),
  };

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: user.id, default_address: address, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
