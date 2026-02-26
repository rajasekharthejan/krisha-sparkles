import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BlogPostClient from "./BlogPostClient";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, seo_title, seo_description, cover_image, excerpt")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return {};
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || data.excerpt || undefined,
    openGraph: {
      title: data.seo_title || data.title,
      description: data.seo_description || data.excerpt || undefined,
      images: data.cover_image ? [{ url: data.cover_image }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  // Increment views (non-blocking, best-effort)
  void Promise.resolve(supabase.rpc("increment_post_views", { post_slug: slug })).catch(() => {});

  return <BlogPostClient post={post} />;
}
