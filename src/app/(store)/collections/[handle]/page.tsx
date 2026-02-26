import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CollectionPageClient from "./CollectionPageClient";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("collections")
    .select("title, meta_title, meta_description")
    .eq("handle", handle)
    .eq("active", true)
    .single();

  if (!data) return {};
  return {
    title: data.meta_title || data.title,
    description: data.meta_description || undefined,
    openGraph: {
      title: data.meta_title || data.title,
      description: data.meta_description || undefined,
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = getSupabaseAdmin();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("handle", handle)
    .eq("active", true)
    .single();

  if (!collection) notFound();

  // Fetch products matching category slugs
  let products = [];
  if (collection.filter_category_slugs && collection.filter_category_slugs.length > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .in("slug", collection.filter_category_slugs);
    const catIds = (cats || []).map((c: { id: string }) => c.id);
    if (catIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .in("category_id", catIds)
        .eq("active", true)
        .gt("stock_quantity", 0)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24);
      products = prods || [];
    }
  } else {
    const { data: prods } = await supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("active", true)
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(24);
    products = prods || [];
  }

  return <CollectionPageClient collection={collection} products={products} />;
}
