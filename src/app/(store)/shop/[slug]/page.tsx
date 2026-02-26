import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: product } = await supabase
      .from("products")
      .select("name, description, images, price, category:categories(name)")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (!product) return { title: "Product Not Found" };

    const image = product.images?.[0] || "https://krisha-sparkles.vercel.app/logo.png";
    const categoryName = (product.category as { name?: string } | null)?.name;
    const title = `${product.name}${categoryName ? ` — ${categoryName}` : ""}`;
    const desc = product.description
      ? product.description.slice(0, 155)
      : `Shop ${product.name} at Krisha Sparkles. Premium imitation jewelry from $${(product.price as number).toFixed(2)}.`;

    return {
      title,
      description: desc,
      openGraph: {
        title: `${product.name} | Krisha Sparkles`,
        description: desc,
        type: "website",
        images: [{ url: image, width: 800, height: 800, alt: product.name as string }],
      },
    };
  } catch {
    return { title: "Product | Krisha Sparkles" };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
