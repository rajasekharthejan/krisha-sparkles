import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Blog — Krisha Sparkles",
  description: "Jewelry styling tips, fashion guides, and care tutorials from Krisha Sparkles.",
};

export const revalidate = 3600;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published: boolean;
  author: string;
  tags: string[];
  views: number;
  created_at: string;
}

export default async function BlogPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, author, tags, views, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const blogPosts = (posts as BlogPost[]) || [];

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <section style={{ textAlign: "center", padding: "4rem 1.5rem 3rem", maxWidth: "700px", margin: "0 auto" }}>
        <span className="badge-gold" style={{ marginBottom: "1rem", display: "inline-block" }}>✦ Journal</span>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
          Style &amp; Stories
        </h1>
        <div className="gold-divider" />
        <p style={{ color: "var(--muted)", marginTop: "1rem", lineHeight: 1.7, fontSize: "0.95rem" }}>
          Jewelry tips, styling inspiration, and care guides from our team.
        </p>
      </section>

      {/* Posts grid */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 1.5rem 5rem" }}>
        {blogPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✍️</p>
            <p style={{ color: "var(--muted)" }}>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
                <article
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {post.cover_image ? (
                    <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                      <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover" }} sizes="400px" />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: "16/9", background: "radial-gradient(ellipse at center, rgba(201,168,76,0.1), var(--elevated))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                      ✍️
                    </div>
                  )}
                  <div style={{ padding: "1.5rem" }}>
                    {post.tags && post.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge-gold" style={{ fontSize: "0.6rem", padding: "0.15rem 0.5rem" }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", lineHeight: 1.3 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--subtle)" }}>
                      <span>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>👁 {post.views}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
