"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Trash2, ToggleLeft, ToggleRight, Instagram } from "lucide-react";
import Image from "next/image";

interface InstaPost {
  id: string;
  post_url: string;
  thumbnail_url: string;
  caption: string | null;
  likes_count: number;
  display_order: number;
  active: boolean;
  created_at: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const emptyForm = { post_url: "", thumbnail_url: "", caption: "", likes_count: "" };

export default function InstagramAdminPage() {
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("instagram_posts").select("*").order("display_order", { ascending: true });
    setPosts((data as InstaPost[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setError("");
    if (!form.post_url.trim()) return setError("Post URL is required");
    if (!form.thumbnail_url.trim()) return setError("Thumbnail URL is required");
    setSaving(true);
    const { error: err } = await supabase.from("instagram_posts").insert({
      post_url: form.post_url.trim(),
      thumbnail_url: form.thumbnail_url.trim(),
      caption: form.caption.trim() || null,
      likes_count: Number(form.likes_count) || 0,
      display_order: posts.length,
      active: true,
    });
    setSaving(false);
    if (err) return setError(err.message);
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("instagram_posts").update({ active: !active }).eq("id", id);
    setPosts((p) => p.map((x) => x.id === id ? { ...x, active: !active } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this Instagram post?")) return;
    await supabase.from("instagram_posts").delete().eq("id", id);
    setPosts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Instagram Feed</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{posts.length} post{posts.length !== 1 ? "s" : ""} · Manage homepage Instagram grid</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); }} className="btn-gold" style={{ fontSize: "0.875rem" }}>
          <Plus size={16} /> Add Post
        </button>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "1.75rem", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>Add Instagram Post</h2>
          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {[
              { key: "post_url", label: "Instagram Post URL *", placeholder: "https://www.instagram.com/p/..." },
              { key: "thumbnail_url", label: "Thumbnail URL *", placeholder: "https://..." },
              { key: "caption", label: "Caption", placeholder: "Optional caption text" },
              { key: "likes_count", label: "Likes Count", placeholder: "0", type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>{label}</label>
                <input
                  type={type || "text"}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="input-dark"
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} className="btn-gold-outline" style={{ fontSize: "0.875rem" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-gold" style={{ fontSize: "0.875rem" }}>
              {saving ? "Saving..." : "Add Post"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
          <Instagram size={48} style={{ color: "var(--muted)", opacity: 0.4, margin: "0 auto 1rem", display: "block" }} strokeWidth={1} />
          <p style={{ color: "var(--muted)" }}>No posts yet. Add your first Instagram post above.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {posts.map((post) => (
            <div key={post.id} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ position: "relative", aspectRatio: "1", background: "var(--elevated)" }}>
                <Image src={post.thumbnail_url} alt={post.caption || "Instagram post"} fill style={{ objectFit: "cover" }} sizes="200px"
                  onError={() => {}} />
              </div>
              <div style={{ padding: "0.75rem" }}>
                {post.caption && <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.caption}</p>}
                <p style={{ fontSize: "0.7rem", color: "var(--subtle)", margin: "0 0 0.5rem" }}>❤️ {post.likes_count} likes</p>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button onClick={() => toggleActive(post.id, post.active)} style={{ background: "none", border: "none", cursor: "pointer", color: post.active ? "var(--gold)" : "var(--muted)" }}>
                    {post.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => handleDelete(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
