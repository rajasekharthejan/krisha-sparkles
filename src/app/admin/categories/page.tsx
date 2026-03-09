"use client";

import { useState, useEffect } from "react";
import { GripVertical, Save, Loader2, Package } from "lucide-react";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  product_count: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoading(false); });
  }, []);

  // ── Drag & drop reordering ─────────────────────────────────────────────────
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }
  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { reset(); return; }
    setCategories((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy.map((c, i) => ({ ...c, display_order: i + 1 }));
    });
    reset();
  }
  function reset() { setDragIdx(null); setDragOverIdx(null); }

  // ── Manual order input ─────────────────────────────────────────────────────
  function setOrder(id: string, val: number) {
    setCategories((prev) =>
      [...prev]
        .map((c) => (c.id === id ? { ...c, display_order: val } : c))
        .sort((a, b) => a.display_order - b.display_order)
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const updates = categories.map((c, i) => ({ id: c.id, display_order: i + 1 }));
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center", paddingTop: "6rem" }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--gold)" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Categories
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Drag to reorder · Categories with 0 products are hidden from the store
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Order"}
        </button>
      </div>

      {/* Hint */}
      <div style={{
        background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)",
        borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.5rem",
        fontSize: "0.8rem", color: "var(--muted)", display: "flex", gap: "0.5rem",
      }}>
        <span>💡</span>
        <span>
          Drag rows to set display order on the homepage. Categories with <strong style={{ color: "var(--text)" }}>0 products</strong> are automatically hidden from the store — add products first to make them visible.
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "40px 40px 1fr 90px 80px",
          padding: "0.6rem 1rem", borderBottom: "1px solid rgba(201,168,76,0.12)",
          fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)",
        }}>
          <span></span>
          <span>Order</span>
          <span>Category</span>
          <span style={{ textAlign: "center" }}>Products</span>
          <span style={{ textAlign: "center" }}>Visible</span>
        </div>

        {categories.map((cat, idx) => {
          const isVisible = cat.product_count > 0;
          const isDragging = dragIdx === idx;
          const isOver = dragOverIdx === idx;

          return (
            <div
              key={cat.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={reset}
              style={{
                display: "grid", gridTemplateColumns: "40px 40px 1fr 90px 80px",
                alignItems: "center", padding: "0.85rem 1rem",
                borderBottom: "1px solid rgba(201,168,76,0.08)",
                background: isDragging
                  ? "rgba(201,168,76,0.08)"
                  : isOver
                    ? "rgba(201,168,76,0.05)"
                    : "transparent",
                borderTop: isOver ? "2px solid var(--gold)" : "2px solid transparent",
                transition: "background 0.15s, opacity 0.15s",
                opacity: isDragging ? 0.5 : 1,
                cursor: "grab",
              }}
            >
              {/* Drag handle */}
              <GripVertical size={16} style={{ color: "var(--subtle)", cursor: "grab" }} />

              {/* Order number */}
              <input
                type="number"
                min={1}
                max={categories.length}
                value={idx + 1}
                onChange={(e) => setOrder(cat.id, parseInt(e.target.value, 10) || 1)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "36px", padding: "0.2rem 0.3rem", textAlign: "center",
                  background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "4px", color: "var(--text)", fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              />

              {/* Category name + icon */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{cat.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{cat.name}</p>
                  <p style={{ color: "var(--subtle)", fontSize: "0.7rem" }}>{cat.slug}</p>
                </div>
              </div>

              {/* Product count */}
              <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                <Package size={13} style={{ color: "var(--subtle)" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: isVisible ? "var(--text)" : "var(--subtle)" }}>
                  {cat.product_count}
                </span>
              </div>

              {/* Visible badge */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  display: "inline-block", padding: "0.2rem 0.6rem",
                  borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700,
                  background: isVisible ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                  color: isVisible ? "#10b981" : "#6b7280",
                  border: `1px solid ${isVisible ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.15)"}`,
                }}>
                  {isVisible ? "Shown" : "Hidden"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "1rem", color: "var(--subtle)", fontSize: "0.75rem", textAlign: "center" }}>
        {categories.filter((c) => c.product_count > 0).length} of {categories.length} categories visible in store
      </p>
    </div>
  );
}
