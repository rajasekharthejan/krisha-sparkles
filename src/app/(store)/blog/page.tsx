"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Clock, Eye, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published: boolean;
  author: string;
  tags: string[];
  views: number;
  created_at: string;
}

function readingTime(content: string | null): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getAllTags(posts: BlogPost[]): string[] {
  const tagSet = new Set<string>();
  posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, content, cover_image, author, tags, views, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as BlogPost[]) || []);
        setLoading(false);
      });
  }, []);

  const allTags = getAllTags(posts);

  // Featured = most viewed
  const featured = posts.length > 0
    ? [...posts].sort((a, b) => b.views - a.views)[0]
    : null;

  const filtered = activeTag
    ? posts.filter((p) => (p.tags || []).includes(activeTag))
    : posts;

  if (loading) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
        <section style={{ textAlign: "center", padding: "4rem 1.5rem 3rem", maxWidth: "700px", margin: "0 auto" }}>
          <span className="badge-gold" style={{ marginBottom: "1rem", display: "inline-block" }}>✦ Journal</span>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
            Style &amp; Stories
          </h1>
        </section>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-box" style={{ borderRadius: "16px", aspectRatio: "4/3" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✍️</p>
            <p style={{ color: "var(--muted)" }}>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured Post Hero */}
            {featured && !activeTag && (
              <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block", marginBottom: "3rem" }}>
                <article
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: "20px",
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    minHeight: "320px",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.35)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  className="featured-post-grid"
                >
                  <div style={{ position: "relative", overflow: "hidden", minHeight: "240px" }}>
                    {featured.cover_image ? (
                      <Image
                        src={featured.cover_image}
                        alt={featured.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="500px"
                      />
                    ) : (
                      <div style={{ height: "100%", background: "radial-gradient(ellipse, rgba(201,168,76,0.15), var(--elevated))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>
                        ✍️
                      </div>
                    )}
                    <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
                      <span className="badge-gold" style={{ fontSize: "0.65rem" }}>⭐ Most Popular</span>
                    </div>
                  </div>
                  <div style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {featured.tags && featured.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                        {featured.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge-gold" style={{ fontSize: "0.6rem", padding: "0.15rem 0.5rem" }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.75rem" }}>
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "1.25rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {featured.excerpt}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.75rem", color: "var(--subtle)", marginBottom: "1.25rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={12} />
                        {readingTime(featured.content)} min read
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Eye size={12} />
                        {featured.views} views
                      </span>
                      <span>{new Date(featured.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--gold)", fontSize: "0.85rem", fontWeight: 600 }}>
                      Read Article <ArrowRight size={14} />
                    </span>
                  </div>
                </article>
              </Link>
            )}

            {/* Tag Filter Pills */}
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                <button
                  onClick={() => setActiveTag(null)}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    border: `1px solid ${activeTag === null ? "var(--gold)" : "var(--gold-border)"}`,
                    background: activeTag === null ? "var(--gold-muted)" : "transparent",
                    color: activeTag === null ? "var(--gold)" : "var(--muted)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    fontWeight: activeTag === null ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  All Posts
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "999px",
                      border: `1px solid ${activeTag === tag ? "var(--gold)" : "var(--gold-border)"}`,
                      background: activeTag === tag ? "var(--gold-muted)" : "transparent",
                      color: activeTag === tag ? "var(--gold)" : "var(--muted)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontWeight: activeTag === tag ? 600 : 400,
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
                <p style={{ color: "var(--muted)" }}>No posts in this category yet.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
                {filtered.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
                    <article
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--gold-border)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        height: "100%",
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
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Clock size={11} />
                              {readingTime(post.content)} min
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Eye size={11} />
                              {post.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .featured-post-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
