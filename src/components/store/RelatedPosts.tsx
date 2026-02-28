import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  tags: string[];
  created_at: string;
}

interface RelatedPostsProps {
  currentSlug: string;
  tags: string[];
}

/**
 * Server component that fetches posts sharing at least one tag with the current post.
 * Falls back to latest posts if no tag matches found.
 */
export default async function RelatedPosts({ currentSlug, tags }: RelatedPostsProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let posts: RelatedPost[] = [];

  // Try to find posts with overlapping tags
  if (tags && tags.length > 0) {
    const { data: tagMatches } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image, tags, created_at")
      .eq("published", true)
      .neq("slug", currentSlug)
      .overlaps("tags", tags)
      .order("created_at", { ascending: false })
      .limit(3);
    posts = (tagMatches as RelatedPost[]) || [];
  }

  // Fallback: latest posts
  if (posts.length < 3) {
    const excludeSlugs = [currentSlug, ...posts.map((p) => p.slug)];
    const { data: fallback } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image, tags, created_at")
      .eq("published", true)
      .not("slug", "in", `(${excludeSlugs.map((s) => `"${s}"`).join(",")})`)
      .order("created_at", { ascending: false })
      .limit(3 - posts.length);
    posts = [...posts, ...((fallback as RelatedPost[]) || [])];
  }

  if (posts.length === 0) return null;

  return (
    <section style={{ marginTop: "3.5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--gold-border)" }}>
      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--gold)" }}>
        ✦ You May Also Enjoy
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <article
              style={{
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(201,168,76,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {post.cover_image ? (
                <div style={{ position: "relative", height: "140px" }}>
                  <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ height: "140px", background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                  ✦
                </div>
              )}
              <div style={{ padding: "1rem" }}>
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.5rem" }}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.excerpt}
                  </p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
