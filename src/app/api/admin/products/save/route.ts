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
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  return user?.email === adminEmail ? user : null;
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    id,              // present = edit, absent = create
    name,
    description,
    price,
    compare_price,
    category_slug,
    images,
    stock_quantity,
    featured,
    active,
    variants,
    variant_stock,
    tags,
    material,
    color,
    occasion,
    style,
  } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Resolve category_slug → category_id
  let category_id: string | null = null;
  if (category_slug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category_slug)
      .single();
    category_id = cat?.id || null;
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const payload = {
    name: name.trim(),
    slug,
    description: description?.trim() || null,
    price: parseFloat(price),
    compare_price: compare_price ? parseFloat(compare_price) : null,
    category_id,
    images: images || [],
    stock_quantity: parseInt(stock_quantity) || 0,
    featured: featured || false,
    active: active ?? true,
    variants: Array.isArray(variants) ? variants : [],
    variant_stock: variant_stock && typeof variant_stock === "object" ? variant_stock : {},
    tags: Array.isArray(tags) ? tags : [],
    material: material?.trim() || null,
    color: color?.trim() || null,
    occasion: occasion?.trim() || null,
    style: style?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    // UPDATE existing product
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("id, slug")
      .single();

    if (error) {
      console.error("Product update error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
    return NextResponse.json({ success: true, product: data });
  } else {
    // CREATE new product — ensure unique slug
    let finalSlug = slug || `product-${Date.now()}`;
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", finalSlug)
      .single();
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({ ...payload, slug: finalSlug })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Product create error:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
    return NextResponse.json({ success: true, product: data });
  }
}
