import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://krisha-sparkles.vercel.app";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Dynamic product routes
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true);

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Dynamic collection routes
    const { data: collections } = await supabase
      .from("collections")
      .select("handle, updated_at")
      .eq("active", true);

    const collectionRoutes: MetadataRoute.Sitemap = (collections || []).map((c) => ({
      url: `${base}/collections/${c.handle}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Dynamic blog post routes
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("published", true);

    const blogRoutes: MetadataRoute.Sitemap = (blogPosts || []).map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...collectionRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
