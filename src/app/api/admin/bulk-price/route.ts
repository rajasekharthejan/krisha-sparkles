import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Verify admin is authenticated
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { updates } = await req.json() as {
    updates: Array<{ id: string; price: number; compare_price?: number | null }>;
  };

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  // Validate all prices
  for (const u of updates) {
    if (!u.id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    if (typeof u.price !== "number" || u.price <= 0) {
      return NextResponse.json({ error: `Invalid price for product ${u.id}` }, { status: 400 });
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
  let updated = 0;
  const errors: string[] = [];

  for (const u of updates) {
    const updatePayload: Record<string, number | null | string> = {
      price: Math.round(u.price * 100) / 100,
      updated_at: new Date().toISOString(),
    };
    if ("compare_price" in u) {
      updatePayload.compare_price = u.compare_price != null
        ? Math.round(u.compare_price * 100) / 100
        : null;
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", u.id);

    if (error) {
      errors.push(`${u.id}: ${error.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({ updated, errors: errors.length > 0 ? errors : undefined });
}
