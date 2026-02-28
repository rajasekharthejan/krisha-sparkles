import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = (
    process.env.ADMIN_EMAIL || "admin@krishasparkles.com"
  ).trim();
  return user?.email === adminEmail ? user : null;
}

// GET — list all bundles with bundle_items + product details
export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("bundles")
    .select(
      `
      *,
      bundle_items (
        id,
        product_id,
        products (id, name, slug, price, images, stock_quantity, active)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bundles: data || [] });
}

// POST — create or update a bundle
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,
    name,
    slug: rawSlug,
    description,
    image,
    bundle_price,
    compare_price,
    active,
    product_ids,
  } = body as {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    bundle_price: number;
    compare_price?: number;
    active?: boolean;
    product_ids: string[];
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!bundle_price || Number(bundle_price) <= 0) {
    return NextResponse.json(
      { error: "Bundle price must be greater than 0" },
      { status: 400 }
    );
  }
  if (!Array.isArray(product_ids) || product_ids.length < 2) {
    return NextResponse.json(
      { error: "A bundle must contain at least 2 products" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  let slug =
    rawSlug?.trim() ||
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const bundlePayload = {
    name: name.trim(),
    slug,
    description: description?.trim() || null,
    image: image?.trim() || null,
    bundle_price: Number(bundle_price),
    compare_price: compare_price ? Number(compare_price) : null,
    active: active ?? true,
    updated_at: new Date().toISOString(),
  };

  let bundleId: string;

  if (id) {
    const { data, error } = await supabase
      .from("bundles")
      .update(bundlePayload)
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    bundleId = data.id as string;

    const { error: deleteError } = await supabase
      .from("bundle_items")
      .delete()
      .eq("bundle_id", bundleId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  } else {
    const { data: existingSlug } = await supabase
      .from("bundles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const { data, error } = await supabase
      .from("bundles")
      .insert({ ...bundlePayload, slug, created_at: new Date().toISOString() })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    bundleId = data.id as string;
  }

  const items = product_ids.map((productId) => ({
    bundle_id: bundleId,
    product_id: productId,
  }));

  const { error: itemsError } = await supabase
    .from("bundle_items")
    .insert(items);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: bundleId });
}

// DELETE — delete a bundle by id query param
export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bundle ID is required" },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  // Delete bundle_items first (FK constraint)
  const { error: itemsError } = await supabase
    .from("bundle_items")
    .delete()
    .eq("bundle_id", id);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { error } = await supabase.from("bundles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
