"use client";

/**
 * /admin/tiktok — TikTok Posts Manager
 * Add/remove/reorder TikTok video thumbnails shown on homepage.
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, GripVertical, Play } from "lucide-react";
import Image from "next/image";

interface TikTokPost {
  id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string | null;
  views_count: number;
  display_order: number;
  active: boolean;
}

export default function TikTokAdminPage() {
  const [posts, setPosts] = useState<TikTokPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ video_url: "", thumbnail_url: "", caption: "", views_count: 0 });

  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tiktok_posts")
      .select("*")
      .order("display_order")
      .limit(20);
    setPosts((data as TikTokPost[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleAdd() {
    if (!form.video_url.trim() || !form.thumbnail_url.trim()) return;
    setSaving(true);
    await supabase.from("tiktok_posts").insert({
      video_url: form.video_url.trim(),
      thumbnail_url: form.thumbnail_url.trim(),
      caption: form.caption.trim() || null,
      views_count: form.views_count || 0,
      display_order: posts.length,
      active: true,
    });
    setForm({ video_url: "", thumbnail_url: "", caption: "", views_count: 0 });
    setShowAdd(false);
    setSaving(false);
    await fetchPosts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this TikTok post?")) return;
    await supabase.from("tiktok_posts").delete().eq("id", id);
    setPosts((p) => p.filter((post) => post.id !== id));
  }

  async function handleToggleActive(post: TikTokPost) {
    await supabase.from("tiktok_posts").update({ active: !post.active }).eq("id", post.id);
    setPosts((p) => p.map((pp) => pp.id === post.id ? { ...pp, active: !pp.active } : pp));
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://shopkrisha.com";

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>TikTok Management</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Manage TikTok video thumbnails shown on the homepage</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", color: "#0a0a0a", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <Plus size={16} /> Add TikTok Post
        </button>
      </div>

      {/* Feed URL cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "TikTok Shop Feed (TSV)", url: "/api/feeds/tiktok-shop" },
          { label: "TikTok Catalog (JSON)", url: "/api/feeds/tiktok-catalog" },
        ].map((feed) => (
          <div key={feed.url} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>{feed.label}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <code style={{ flex: 1, fontSize: "0.75rem", color: "var(--gold)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {siteUrl}{feed.url}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(`${siteUrl}${feed.url}`)}
                style={{ padding: "0.3rem 0.6rem", background: "rgba(201,168,76,0.1)", border: "1px solid var(--gold-border)", borderRadius: "5px", color: "var(--gold)", cursor: "pointer", fontSize: "0.7rem" }}
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Posts grid */}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : posts.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</div>
          <p style={{ color: "var(--muted)" }}>No TikTok posts yet. Add your first video thumbnail above.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {posts.map((post) => (
            <div key={post.id} style={{ background: "var(--surface)", border: `1px solid ${post.active ? "var(--gold-border)" : "rgba(255,255,255,0.1)"}`, borderRadius: "12px", overflow: "hidden", opacity: post.active ? 1 : 0.5 }}>
              <div style={{ position: "relative", aspectRatio: "9/16", maxHeight: "300px" }}>
                <Image src={post.thumbnail_url} alt={post.caption || "TikTok"} fill style={{ objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.15)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={16} fill="white" color="white" />
                </div>
              </div>
              <div style={{ padding: "0.75rem" }}>
                {post.caption && <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.caption}</p>}
                {post.views_count > 0 && <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{post.views_count.toLocaleString()} views</p>}
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                  <button onClick={() => handleToggleActive(post)} style={{ flex: 1, padding: "0.3rem", borderRadius: "5px", border: "1px solid var(--gold-border)", background: "transparent", color: post.active ? "#10b981" : "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
                    {post.active ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => handleDelete(post.id)} style={{ padding: "0.3rem 0.5rem", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Post Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "14px", padding: "2rem", width: "100%", maxWidth: "480px" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Add TikTok Post</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "TikTok Video URL *", key: "video_url", placeholder: "https://www.tiktok.com/@krishasparkles/video/..." },
                { label: "Thumbnail Image URL *", key: "thumbnail_url", placeholder: "https://..." },
                { label: "Caption (optional)", key: "caption", placeholder: "✨ New arrivals!" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>{label}</label>
                  <input
                    className="input-dark"
                    type="text"
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.4rem" }}>Views Count (optional)</label>
                <input
                  className="input-dark"
                  type="number"
                  value={form.views_count}
                  onChange={(e) => setForm((f) => ({ ...f, views_count: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 15000"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "0.65rem", background: "none", border: "1px solid var(--gold-border)", borderRadius: "8px", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !form.video_url.trim() || !form.thumbnail_url.trim()}
                  style={{ flex: 1, padding: "0.65rem", background: "linear-gradient(135deg,#c9a84c,#e8c96a)", color: "#0a0a0a", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? "Adding..." : "Add Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
