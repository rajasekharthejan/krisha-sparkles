"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CATEGORIES, MATERIALS, COLORS, OCCASIONS, STYLES } from "@/lib/utils";
import { Upload, X, Plus, Loader2, Trash2, GripVertical, Star } from "lucide-react";
import type { Product, ProductVariant } from "@/types";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

export default function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({});

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    compare_price: product?.compare_price?.toString() || "",
    category: product?.category?.slug || "",
    stock_quantity: product?.stock_quantity?.toString() || "0",
    featured: product?.featured || false,
    active: product?.active ?? true,
    material: product?.material || "",
    color: product?.color || "",
    occasion: product?.occasion || "",
    style: product?.style || "",
    tags: product?.tags?.join(", ") || "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Image upload failed");
      } else {
        if (data.urls?.length) {
          setImages((prev) => [...prev, ...data.urls]);
        }
        if (data.errors?.length) {
          setError(`Some files failed: ${data.errors.join(", ")}`);
        }
      }
    } catch {
      setError("Upload failed — check your connection and try again.");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function makePrimary(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  }

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mode === "edit" ? product!.id : undefined,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price,
          compare_price: form.compare_price || null,
          category_slug: form.category,
          images,
          stock_quantity: form.stock_quantity,
          featured: form.featured,
          active: form.active,
          variants: variants.filter((v) => v.name.trim() && v.options.length > 0),
          material: form.material || null,
          color: form.color || null,
          occasion: form.occasion || null,
          style: form.style || null,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product");
        setLoading(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "var(--elevated)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle = {
    fontSize: "0.75rem",
    fontWeight: 600 as const,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    display: "block",
    marginBottom: "0.5rem",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Name */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Basic Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g., Gold Kundan Necklace Set" style={inputStyle} className="input-dark" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the product, materials, occasion..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  className="input-dark"
                />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle} className="input-dark">
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Pricing
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Price ($) *</label>
                <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required placeholder="0.00" style={inputStyle} className="input-dark" />
              </div>
              <div>
                <label style={labelStyle}>Compare Price ($)</label>
                <input name="compare_price" type="number" step="0.01" min="0" value={form.compare_price} onChange={handleChange} placeholder="0.00 (original/crossed price)" style={inputStyle} className="input-dark" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Product Images
            </h3>

            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed rgba(201,168,76,0.3)",
                borderRadius: "10px",
                padding: "2rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.background = "var(--gold-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {uploading ? (
                <Loader2 size={24} style={{ color: "var(--gold)", margin: "0 auto", animation: "spin 1s linear infinite" }} />
              ) : (
                <Upload size={24} style={{ color: "var(--gold)", margin: "0 auto" }} />
              )}
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                {uploading ? "Uploading..." : "Click to upload images"}
              </p>
              <p style={{ color: "var(--subtle)", fontSize: "0.7rem" }}>PNG, JPG, WEBP up to 10MB each</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />

            {/* Image count */}
            {images.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {images.length} image{images.length !== 1 ? "s" : ""} · First = primary (shown in cart & listings)
                </span>
                <button
                  type="button"
                  onClick={() => setImages([])}
                  style={{ fontSize: "0.7rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
                >
                  Remove all
                </button>
              </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
                {images.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = parseInt(e.dataTransfer.getData("text/plain"));
                      if (!isNaN(from) && from !== i) moveImage(from, i);
                    }}
                    style={{
                      position: "relative",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: i === 0 ? "2px solid var(--gold)" : "1px solid var(--gold-border)",
                      background: "var(--elevated)",
                      cursor: "grab",
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", aspectRatio: "1" }}>
                      <Image src={url} alt="" fill style={{ objectFit: "cover" }} sizes="160px" />
                      {/* Index badge */}
                      <span style={{
                        position: "absolute", top: "6px", left: "6px",
                        background: "rgba(0,0,0,0.7)", color: i === 0 ? "var(--gold)" : "#fff",
                        borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700,
                        padding: "1px 5px", lineHeight: "16px",
                      }}>
                        {i === 0 ? "★ Primary" : `#${i + 1}`}
                      </span>
                      {/* Grip icon (visual drag hint) */}
                      <span style={{
                        position: "absolute", top: "6px", right: "6px",
                        color: "rgba(255,255,255,0.7)",
                      }}>
                        <GripVertical size={14} />
                      </span>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "1px" }}>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => makePrimary(i)}
                          title="Set as primary image"
                          style={{
                            flex: 1, padding: "5px 4px", background: "var(--gold-muted)",
                            border: "none", borderTop: "1px solid var(--gold-border)",
                            cursor: "pointer", color: "var(--gold)", fontSize: "0.65rem",
                            fontWeight: 600, display: "flex", alignItems: "center",
                            justifyContent: "center", gap: "3px",
                          }}
                        >
                          <Star size={10} /> Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        title="Delete image"
                        style={{
                          flex: i === 0 ? undefined : undefined,
                          width: i === 0 ? "100%" : "36px",
                          padding: "5px",
                          background: "rgba(239,68,68,0.15)",
                          border: "none", borderTop: "1px solid rgba(239,68,68,0.2)",
                          cursor: "pointer", color: "#ef4444", fontSize: "0.65rem",
                          fontWeight: 600, display: "flex", alignItems: "center",
                          justifyContent: "center", gap: "3px",
                        }}
                      >
                        <Trash2 size={11} />
                        {i === 0 && " Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, color: "var(--gold)", margin: 0 }}>
                Variants <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.72rem", fontWeight: 400, color: "var(--muted)" }}>(Color, Size, etc.)</span>
              </h3>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, { name: "", options: [] }])}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.4rem 0.75rem", color: "var(--gold)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
              >
                <Plus size={13} /> Add Variant Group
              </button>
            </div>

            {variants.length === 0 ? (
              <p style={{ color: "var(--subtle)", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>
                No variants. Add one if this product comes in different colors, sizes, etc.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {variants.map((variant, vi) => (
                  <div key={vi} style={{ background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "8px", padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" }}>
                      <input
                        value={variant.name}
                        onChange={(e) => setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, name: e.target.value } : v))}
                        placeholder="Variant name (e.g. Color)"
                        style={{ ...inputStyle, flex: 1 }}
                        className="input-dark"
                      />
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== vi))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px", display: "flex" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {/* Options */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      {variant.options.map((opt, oi) => (
                        <span key={oi} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "9999px", fontSize: "0.75rem", color: "var(--text)" }}>
                          {opt}
                          <button
                            type="button"
                            onClick={() => setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex", lineHeight: 1 }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* Add option input */}
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <input
                        value={newOptionInputs[vi] || ""}
                        onChange={(e) => setNewOptionInputs((prev) => ({ ...prev, [vi]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = (newOptionInputs[vi] || "").trim();
                            if (val) {
                              setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: [...v.options, val] } : v));
                              setNewOptionInputs((prev) => ({ ...prev, [vi]: "" }));
                            }
                          }
                        }}
                        placeholder={`Add option (press Enter)`}
                        style={{ ...inputStyle, flex: 1, fontSize: "0.8rem", padding: "0.5rem 0.75rem" }}
                        className="input-dark"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (newOptionInputs[vi] || "").trim();
                          if (val) {
                            setVariants((prev) => prev.map((v, i) => i === vi ? { ...v, options: [...v.options, val] } : v));
                            setNewOptionInputs((prev) => ({ ...prev, [vi]: "" }));
                          }
                        }}
                        style={{ padding: "0 0.75rem", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "6px", color: "var(--gold)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Metadata */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Product Metadata
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Material</label>
                <select name="material" value={form.material} onChange={handleChange} style={inputStyle} className="input-dark">
                  <option value="">Select material</option>
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <select name="color" value={form.color} onChange={handleChange} style={inputStyle} className="input-dark">
                  <option value="">Select color</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Occasion</label>
                <select name="occasion" value={form.occasion} onChange={handleChange} style={inputStyle} className="input-dark">
                  <option value="">Select occasion</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Style</label>
                <select name="style" value={form.style} onChange={handleChange} style={inputStyle} className="input-dark">
                  <option value="">Select style</option>
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Tags</label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="bridal, kundan, wedding, gold (comma separated)"
                style={inputStyle}
                className="input-dark"
              />
              <p style={{ fontSize: "0.7rem", color: "var(--subtle)", marginTop: "0.35rem" }}>
                Comma-separated tags for search and filtering
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>
          {/* Inventory */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Inventory
            </h3>
            <div>
              <label style={labelStyle}>Stock Quantity</label>
              <input
                name="stock_quantity"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={handleChange}
                style={inputStyle}
                className="input-dark"
              />
            </div>
          </div>

          {/* Status */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--gold)" }}>
              Status
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  style={{ accentColor: "var(--gold)", width: "16px", height: "16px" }}
                />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Active</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Visible in the store</p>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                  style={{ accentColor: "var(--gold)", width: "16px", height: "16px" }}
                />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Featured</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Show on homepage</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          {error && (
            <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold" style={{ width: "100%", justifyContent: "center" }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
            {loading ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
