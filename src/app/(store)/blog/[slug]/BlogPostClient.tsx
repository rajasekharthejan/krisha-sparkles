"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string;
  tags: string[];
  views: number;
  created_at: string;
}

export default function BlogPostClient({ post }: { post: BlogPost }) {
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Cover image */}
      {post.cover_image && (
        <div style={{ position: "relative", height: "420px", overflow: "hidden" }}>
          <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover", opacity: 0.6 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, var(--bg))" }} />
        </div>
      )}

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: `${post.cover_image ? "0" : "2rem"} 1.5rem 5rem` }}>
        {/* Back link */}
        <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: post.cover_image ? "-2rem" : "0", position: "relative" }}>
          <ArrowLeft size={16} /> All Posts
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {post.tags.map((tag) => (
              <span key={tag} className="badge-gold" style={{ fontSize: "0.65rem" }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", fontSize: "0.8rem", color: "var(--subtle)", marginBottom: "2rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Calendar size={13} />
            {new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Eye size={13} /> {post.views} views
          </span>
          <span>By {post.author}</span>
          <button onClick={handleShare} style={{ background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.25rem 0.7rem", color: "var(--gold)", cursor: "pointer", fontSize: "0.75rem" }}>
            Share ↗
          </button>
        </div>

        <div className="gold-divider" style={{ marginBottom: "2.5rem" }} />

        {/* Markdown content */}
        <div
          style={{
            lineHeight: 1.85,
            fontSize: "0.95rem",
            color: "var(--muted)",
          }}
          className="blog-content"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--gold-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Link href="/blog" className="btn-gold-outline" style={{ fontSize: "0.875rem" }}>
            <ArrowLeft size={15} /> More Posts
          </Link>
          <Link href="/shop" className="btn-gold" style={{ fontSize: "0.875rem" }}>
            Shop Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
