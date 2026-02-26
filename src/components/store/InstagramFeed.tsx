"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";

interface InstaPost {
  id: string;
  post_url: string;
  thumbnail_url: string;
  caption: string | null;
  likes_count: number;
  display_order: number;
}

// Placeholder tiles shown when no posts are in DB yet
const PLACEHOLDER_TILES = [
  { emoji: "💎", label: "Jadau Collection", likes: 124 },
  { emoji: "✨", label: "Gold Necklaces", likes: 89 },
  { emoji: "📿", label: "Pendant Sets", likes: 201 },
  { emoji: "👑", label: "Bridal Jewelry", likes: 156 },
];

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("instagram_posts")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .limit(6)
      .then(({ data }) => {
        setPosts((data as InstaPost[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shimmer-box" style={{ aspectRatio: "1", borderRadius: "12px" }} />
        ))}
      </div>
    );
  }

  // If no posts in DB yet, fall back to placeholders
  if (posts.length === 0) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {PLACEHOLDER_TILES.map((tile, i) => (
          <a
            key={i}
            href="https://www.instagram.com/krisha.sparkles/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", animation: `scaleIn 0.5s ease both`, animationDelay: `${i * 0.1}s` }}
          >
            <div className="insta-tile-inner">
              <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>{tile.emoji}</span>
              <span style={{ fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", padding: "0 0.25rem" }}>
                {tile.label}
              </span>
              <div className="insta-tile-overlay">
                <span style={{ color: "#fff", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Heart size={11} fill="#fff" /> {tile.likes}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: posts.length >= 4 ? "repeat(3, 1fr)" : "1fr 1fr",
        gap: "0.5rem",
      }}
    >
      {posts.slice(0, 6).map((post, i) => (
        <a
          key={post.id}
          href={post.post_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "none",
            display: "block",
            position: "relative",
            aspectRatio: "1",
            borderRadius: "10px",
            overflow: "hidden",
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            animation: `scaleIn 0.5s ease both`,
            animationDelay: `${i * 0.08}s`,
          }}
        >
          <Image
            src={post.thumbnail_url}
            alt={post.caption || `Instagram post ${i + 1}`}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            style={{ objectFit: "cover" }}
          />
          {/* Hover overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0)",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "0.3rem",
            }}
            className="insta-real-overlay"
          >
            <span style={{ color: "#fff", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px", opacity: 0, transition: "opacity 0.2s" }} className="insta-overlay-content">
              <Heart size={13} fill="#fff" /> {post.likes_count}
            </span>
            {post.caption && (
              <span style={{ color: "#fff", fontSize: "0.65rem", textAlign: "center", padding: "0 0.5rem", opacity: 0, transition: "opacity 0.2s", lineHeight: 1.3, maxHeight: "2.6em", overflow: "hidden" }} className="insta-overlay-content">
                {post.caption.slice(0, 60)}{post.caption.length > 60 ? "…" : ""}
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
