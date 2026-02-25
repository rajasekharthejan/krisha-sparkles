import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

interface BulkProductRow {
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_slug?: string;
  stock_quantity: number;
  featured: boolean;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Verify admin session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rows: BulkProductRow[] = body.products;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: "Max 500 products per upload" }, { status: 400 });
    }

    // Fetch categories for slug → id lookup
    const { data: categories } = await supabase.from("categories").select("id, slug");
    const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]) ?? []);

    const results = { success: 0, failed: 0, errors: [] as { row: number; error: string }[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Validate required fields
        if (!row.name?.trim()) throw new Error("Name is required");
        if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0)
          throw new Error("Price must be a positive number");

        const images = [row.image_url_1, row.image_url_2, row.image_url_3]
          .filter(Boolean) as string[];

        const category_id = row.category_slug
          ? categoryMap.get(row.category_slug.toLowerCase().trim()) ?? null
          : null;

        const slug = slugify(row.name);

        const { error } = await supabase.from("products").upsert(
          {
            name: row.name.trim(),
            slug,
            description: row.description?.trim() ?? null,
            price: Number(row.price),
            compare_price: row.compare_price ? Number(row.compare_price) : null,
            category_id,
            stock_quantity: Number(row.stock_quantity) || 0,
            featured: String(row.featured).toLowerCase() === "true",
            images,
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

        if (error) throw new Error(error.message);
        results.success++;
      } catch (err: unknown) {
        results.failed++;
        results.errors.push({ row: i + 2, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Bulk upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
