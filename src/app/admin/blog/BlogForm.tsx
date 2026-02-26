"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
}

interface Props {
  initialData?: Partial<BlogFormData> & { id?: string };
  mode: "create" | "edit";
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function BlogForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    cover_image: initialData?.cover_image || "",
    author: initialData?.author || "Krisha Sparkles",
    tags: initialData?.tags || "",
    seo_title: initialData?.seo_title || "",
    seo_description: initialData?.seo_description || "",
    published: initialData?.published ?? false,
  });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    if (!form.content.trim()) return setError("Content is required");
    const finalSlug = form.slug.trim() || slugify(form.title);
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: finalSlug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image: form.cover_image.trim() || null,
      author: form.author.trim() || "Krisha Sparkles",
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    if (mode === "edit" && initialData?.id) {
      const { error: err } = await supabase.from("blog_posts").update(payload).eq("id", initialData.id);
      if (err) { setSaving(false); return setError(err.message); }
    } else {
      const { error: err } = await supabase.from("blog_posts").insert(payload);
      if (err) { setSaving(false); return setError(err.message.includes("unique") ? "A post with this slug already exists" : err.message); }
    }

    setSaving(false);
    router.push("/admin/blog");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Link href="/admin/blog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back to Blog
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          {mode === "edit" ? "Edit Post" : "New Post"}
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setPreview(!preview)}
            style={{ background: "none", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.4rem 0.9rem", color: "var(--muted)", cursor: "pointer", fontSize: "0.8rem" }}>
            {preview ? "Edit" : "Preview"}
          </button>
          <button onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
            style={{
              background: form.published ? "rgba(16,185,129,0.1)" : "rgba(201,168,76,0.08)",
              border: `1px solid ${form.published ? "rgba(16,185,129,0.3)" : "var(--gold-border)"}`,
              borderRadius: "6px", padding: "0.4rem 0.9rem",
              color: form.published ? "#10b981" : "var(--gold)", cursor: "pointer", fontSize: "0.8rem"
            }}>
            {form.published ? "✓ Published" : "Draft"}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gold" style={{ fontSize: "0.875rem" }}>
            {saving ? "Saving..." : mode === "edit" ? "Save" : "Create Post"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", alignItems: "start" }}>
        {/* Main content area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Title *</label>
            <input value={form.title} onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: f.slug || slugify(title) }));
            }} placeholder="Post title" className="input-dark" style={{ fontSize: "1.1rem", fontFamily: "var(--font-playfair)" }} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Content * (Markdown supported)
              </label>
            </div>
            {preview ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "1.5rem", minHeight: "400px" }} className="blog-content">
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>Preview (markdown rendered on frontend):</p>
                <pre style={{ whiteSpace: "pre-wrap", color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>{form.content}</pre>
              </div>
            ) : (
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={"Write your post in Markdown...\n\n## Section Title\n\nYour content here..."}
                rows={20}
                className="input-dark"
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "monospace", fontSize: "0.875rem", lineHeight: 1.7 }}
              />
            )}
          </div>
        </div>

        {/* Sidebar fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "5rem" }}>
          {[
            { key: "slug", label: "Slug (URL)", placeholder: "auto-generated from title", hint: "Leave blank to auto-generate" },
            { key: "excerpt", label: "Excerpt", placeholder: "Short summary..." },
            { key: "cover_image", label: "Cover Image URL", placeholder: "https://..." },
            { key: "author", label: "Author", placeholder: "Krisha Sparkles" },
            { key: "tags", label: "Tags (comma-separated)", placeholder: "jewelry,tips,style" },
            { key: "seo_title", label: "SEO Title", placeholder: "Optional override" },
            { key: "seo_description", label: "SEO Description", placeholder: "160 characters..." },
          ].map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>{label}</label>
              {hint && <p style={{ fontSize: "0.68rem", color: "var(--subtle)", marginBottom: "0.35rem" }}>{hint}</p>}
              <input value={form[key as keyof BlogFormData] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="input-dark" style={{ fontSize: "0.8rem" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
