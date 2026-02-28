"use client";

import { useEffect, useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface TikTokPost {
  id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string | null;
  views_count: number;
  display_order: number;
}

export default function TikTokFeed() {
  const [posts, setPosts] = useState<TikTokPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tiktok_posts")
      .select("*")
      .eq("active", true)
      .order("display_order")
      .limit(6)
      .then(({ data }) => {
        setPosts((data as TikTokPost[]) || []);
        setLoading(false);
      });
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="badge-gold" style={{ display: "inline-block", marginBottom: "0.5rem" }}>✦ TikTok</span>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Watch &amp; Shop
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            See our jewelry in action
          </p>
        </div>
        <a
          href="https://www.tiktok.com/@krishasparkles"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.55rem 1.1rem",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid var(--gold-border)",
            borderRadius: "8px",
            color: "var(--gold)",
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          <ExternalLink size={14} /> Follow on TikTok
        </a>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{ aspectRatio: "9/16", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--gold-border)", animation: "pulse 2s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.video_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                position: "relative",
                aspectRatio: "9/16",
                borderRadius: "12px",
                overflow: "hidden",
                textDecoration: "none",
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
              }}
            >
              <Image
                src={post.thumbnail_url}
                alt={post.caption || "TikTok video"}
                fill
                style={{ objectFit: "cover", transition: "transform 0.3s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
              />
              {/* Overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))" }} />
              {/* Play button */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.15)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <Play size={18} fill="white" color="white" />
              </div>
              {/* Views */}
              {post.views_count > 0 && (
                <div style={{ position: "absolute", bottom: "8px", left: "8px", color: "white", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                  <Play size={10} fill="white" color="white" />
                  {post.views_count >= 1000 ? `${(post.views_count / 1000).toFixed(1)}K` : post.views_count}
                </div>
              )}
              {/* TikTok icon badge */}
              <div style={{ position: "absolute", top: "8px", right: "8px", fontSize: "16px" }}>🎵</div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
