"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  hero_image: string | null;
  filter_category_slugs: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean;
  display_order: number;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CollectionsAdminPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("collections").select("*").order("display_order", { ascending: true });
    setCollections((data as Collection[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("collections").update({ active: !active }).eq("id", id);
    setCollections((c) => c.map((x) => x.id === id ? { ...x, active: !active } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    await supabase.from("collections").delete().eq("id", id);
    setCollections((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Collections</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{collections.length} collection{collections.length !== 1 ? "s" : ""} · Used as ad landing pages</p>
        </div>
        <Link href="/admin/collections/new" className="btn-gold" style={{ fontSize: "0.875rem" }}>
          <Plus size={16} /> New Collection
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading...</div>
      ) : collections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--gold-border)" }}>
          <p style={{ color: "var(--muted)" }}>No collections yet. Create your first ad landing page!</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden" }}>
          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Collection</th>
                <th>Handle / URL</th>
                <th>Filters</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{c.title}</p>
                    {c.description && <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "2px 0 0" }}>{c.description.slice(0, 60)}{c.description.length > 60 ? "…" : ""}</p>}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gold)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      /collections/{c.handle}
                      <a href={`/collections/${c.handle}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)" }}>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    {(c.filter_category_slugs || []).join(", ") || "All products"}
                  </td>
                  <td>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600,
                      background: c.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: c.active ? "#10b981" : "#ef4444" }}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Link href={`/admin/collections/${c.id}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--gold)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--muted)")}>
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => toggleActive(c.id, c.active)} style={{ background: "none", border: "none", cursor: "pointer", color: c.active ? "var(--gold)" : "var(--muted)" }}>
                        {c.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                        <Trash2 size={16} />
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
