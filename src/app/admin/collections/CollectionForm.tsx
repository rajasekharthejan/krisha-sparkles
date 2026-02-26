"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CollectionFormData {
  handle: string;
  title: string;
  description: string;
  hero_image: string;
  filter_category_slugs: string;
  meta_title: string;
  meta_description: string;
  active: boolean;
  display_order: number;
}

interface Props {
  initialData?: Partial<CollectionFormData> & { id?: string };
  mode: "create" | "edit";
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CollectionForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CollectionFormData>({
    handle: initialData?.handle || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    hero_image: initialData?.hero_image || "",
    filter_category_slugs: (initialData?.filter_category_slugs as unknown as string) || "",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    active: initialData?.active ?? true,
    display_order: initialData?.display_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    if (!form.handle.trim()) return setError("Handle is required");
    if (!/^[a-z0-9-]+$/.test(form.handle)) return setError("Handle must be lowercase letters, numbers, and hyphens only");

    setSaving(true);
    const payload = {
      handle: form.handle.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      hero_image: form.hero_image.trim() || null,
      filter_category_slugs: form.filter_category_slugs
        ? form.filter_category_slugs.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      active: form.active,
      display_order: form.display_order,
      updated_at: new Date().toISOString(),
    };

    if (mode === "edit" && initialData?.id) {
      const { error: err } = await supabase.from("collections").update(payload).eq("id", initialData.id);
      if (err) { setSaving(false); return setError(err.message); }
    } else {
      const { error: err } = await supabase.from("collections").insert(payload);
      if (err) { setSaving(false); return setError(err.message.includes("unique") ? "Handle already exists" : err.message); }
    }

    setSaving(false);
    router.push("/admin/collections");
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <Link href="/admin/collections" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Back to Collections
      </Link>

      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>
        {mode === "edit" ? "Edit Collection" : "New Collection"}
      </h1>

      {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {[
          { key: "title", label: "Title *", placeholder: "e.g. Wedding Jewelry" },
          { key: "handle", label: "Handle *", placeholder: "e.g. wedding-jewelry (URL slug)", hint: "Lowercase, hyphens only" },
          { key: "description", label: "Description", placeholder: "Short description shown on the page" },
          { key: "hero_image", label: "Hero Image URL", placeholder: "https://..." },
          { key: "filter_category_slugs", label: "Category Slugs (comma-separated)", placeholder: "necklaces,earrings,pendant-sets" },
          { key: "meta_title", label: "SEO Title", placeholder: "Wedding Jewelry — Krisha Sparkles" },
          { key: "meta_description", label: "SEO Description", placeholder: "Shop our wedding jewelry collection..." },
          { key: "display_order", label: "Display Order", placeholder: "0", type: "number" },
        ].map(({ key, label, placeholder, hint, type }) => (
          <div key={key} style={key === "description" || key === "meta_description" ? { gridColumn: "1 / -1" } : {}}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>{label}</label>
            {hint && <p style={{ fontSize: "0.7rem", color: "var(--subtle)", margin: "-0.2rem 0 0.4rem" }}>{hint}</p>}
            <input
              type={type || "text"}
              value={String(form[key as keyof CollectionFormData])}
              onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
              placeholder={placeholder}
              className="input-dark"
            />
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => setForm((f) => ({ ...f, active: !f.active }))} style={{ background: "none", border: "none", cursor: "pointer", color: form.active ? "var(--gold)" : "var(--muted)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <span style={{ fontSize: "1.4rem" }}>{form.active ? "🟢" : "⚫"}</span>
            {form.active ? "Active (visible to visitors)" : "Inactive (hidden)"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
        <Link href="/admin/collections" className="btn-gold-outline" style={{ fontSize: "0.875rem" }}>Cancel</Link>
        <button onClick={handleSave} disabled={saving} className="btn-gold" style={{ fontSize: "0.875rem" }}>
          {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Collection"}
        </button>
      </div>
    </div>
  );
}
