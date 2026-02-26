"use client";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  tags: string[];
  created_at: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("id, title, slug, published, views, tags, created_at").order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublish(id: string, published: boolean) {
    await supabase.from("blog_posts").update({ published: !published }).eq("id", id);
    setPosts((p) => p.map((x) => x.id === id ? { ...x, published: !published } : x));
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Blog</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{posts.length} post{posts.length !== 1 ? "s" : ""} · {posts.filter((p) => p.published).length} published</p>
        </div>
        <Link href="/admin/blog/new" className="btn-gold" style={{ fontSize: "0.875rem" }}>
          <Plus size={16} /> New Post
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
          <p style={{ color: "var(--muted)" }}>No blog posts yet. Write your first post!</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden" }}>
          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr><th>Title</th><th>Tags</th><th>Views</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.title}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{(p.tags || []).join(", ") || "—"}</td>
                  <td style={{ fontSize: "0.875rem" }}>{p.views}</td>
                  <td style={{ color: "var(--subtle)", fontSize: "0.8rem" }}>{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}</td>
                  <td>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600,
                      background: p.published ? "rgba(16,185,129,0.1)" : "rgba(201,168,76,0.1)",
                      color: p.published ? "#10b981" : "var(--gold)" }}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Link href={`/admin/blog/${p.id}/edit`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--gold)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--muted)")}>
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => togglePublish(p.id, p.published)} title={p.published ? "Unpublish" : "Publish"}
                        style={{ background: "none", border: "none", cursor: "pointer", color: p.published ? "var(--gold)" : "var(--muted)" }}>
                        {p.published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
