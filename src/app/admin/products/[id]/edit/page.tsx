import { createAdminClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Product } from "@/types";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link
          href="/admin/products"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            color: "var(--muted)",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          <ChevronLeft size={16} />
          Back to Products
        </Link>
        <span style={{ color: "var(--subtle)" }}>›</span>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Edit: {product.name}
        </h1>
      </div>
      <ProductForm mode="edit" product={product as Product} />
    </div>
  );
}
