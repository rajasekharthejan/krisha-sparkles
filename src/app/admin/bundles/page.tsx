"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  X,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock_quantity: number;
}

interface BundleItemRecord {
  id: string;
  product_id: string;
  products: ProductOption;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  compare_price: number | null;
  active: boolean;
  created_at: string;
  bundle_items: BundleItemRecord[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  image: string;
  bundle_price: string;
  compare_price: string;
  active: boolean;
  product_ids: string[];
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  image: "",
  bundle_price: "",
  compare_price: "",
  active: true,
  product_ids: [],
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Product search state
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const loadBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bundles");
      if (res.ok) {
        const json = await res.json();
        setBundles(json.bundles || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const loadProducts = useCallback(async () => {
    if (allProducts.length > 0) return; // already loaded
    setProductsLoading(true);
    try {
      // Use supabase REST via admin products endpoint — fetches all active products
      const res = await fetch("/api/admin/products/list");
      if (res.ok) {
        const json = await res.json();
        setAllProducts(json.products || []);
      } else {
        // Fallback: fetch directly from public products endpoint (active only)
        const res2 = await fetch("/api/admin/bundles-products");
        if (res2.ok) {
          const json2 = await res2.json();
          setAllProducts(json2.products || []);
        }
      }
    } finally {
      setProductsLoading(false);
    }
  }, [allProducts.length]);

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSearchQuery("");
    setShowModal(true);
    loadProducts();
  }

  function openEdit(bundle: Bundle) {
    setForm({
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description || "",
      image: bundle.image || "",
      bundle_price: String(bundle.bundle_price),
      compare_price: bundle.compare_price ? String(bundle.compare_price) : "",
      active: bundle.active,
      product_ids: bundle.bundle_items.map((bi) => bi.product_id),
    });
    setEditingId(bundle.id);
    setError("");
    setSearchQuery("");
    setShowModal(true);
    loadProducts();
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSearchQuery("");
  }

  // Auto-generate slug when name changes (only in create mode)
  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: editingId ? f.slug : slugify(value),
    }));
  }

  function toggleProduct(productId: string) {
    setForm((f) => {
      const exists = f.product_ids.includes(productId);
      return {
        ...f,
        product_ids: exists
          ? f.product_ids.filter((id) => id !== productId)
          : [...f.product_ids, productId],
      };
    });
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async function handleSave() {
    setError("");
    if (!form.name.trim()) return setError("Bundle name is required");
    if (!form.bundle_price || Number(form.bundle_price) <= 0)
      return setError("Bundle price must be greater than 0");
    if (form.product_ids.length < 2)
      return setError("Select at least 2 products for the bundle");

    setSaving(true);
    try {
      const body = {
        id: editingId || undefined,
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        bundle_price: Number(form.bundle_price),
        compare_price: form.compare_price ? Number(form.compare_price) : undefined,
        active: form.active,
        product_ids: form.product_ids,
      };

      const res = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save bundle");
      } else {
        closeModal();
        loadBundles();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete bundle "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/bundles?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBundles((b) => b.filter((x) => x.id !== id));
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete bundle");
      }
    } finally {
      setDeleting(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Filtered products for search
  // ---------------------------------------------------------------------------

  const filteredProducts = allProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedProducts = allProducts.filter((p) =>
    form.product_ids.includes(p.id)
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Bundle Builder
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {bundles.length} bundle{bundles.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-gold"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          <Plus size={16} />
          New Bundle
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--muted)",
          }}
        >
          Loading bundles...
        </div>
      ) : bundles.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "16px",
            padding: "4rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Package
            size={56}
            strokeWidth={1}
            style={{ color: "var(--gold)", opacity: 0.4 }}
          />
          <h3
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.25rem",
              margin: 0,
            }}
          >
            No bundles yet
          </h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Create your first bundle to start selling curated sets.
          </p>
          <button onClick={openCreate} className="btn-gold">
            Create First Bundle
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Bundle</th>
                  <th>Items</th>
                  <th>Bundle Price</th>
                  <th>Compare Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle) => {
                  const displayImage =
                    bundle.image ||
                    bundle.bundle_items?.[0]?.products?.images?.[0] ||
                    null;

                  return (
                    <tr key={bundle.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              background: "var(--bg)",
                              flexShrink: 0,
                              position: "relative",
                              border: "1px solid var(--gold-border)",
                            }}
                          >
                            {displayImage ? (
                              <Image
                                src={displayImage}
                                alt={bundle.name}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="44px"
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0.3,
                                }}
                              >
                                <Package size={20} strokeWidth={1} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                margin: 0,
                                fontSize: "0.9rem",
                              }}
                            >
                              {bundle.name}
                            </p>
                            <p
                              style={{
                                color: "var(--muted)",
                                fontSize: "0.75rem",
                                margin: "2px 0 0",
                                fontFamily: "monospace",
                              }}
                            >
                              /bundles/{bundle.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                        {bundle.bundle_items?.length || 0} product
                        {bundle.bundle_items?.length !== 1 ? "s" : ""}
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: "var(--gold)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {formatPrice(bundle.bundle_price)}
                      </td>
                      <td
                        style={{
                          color: "var(--muted)",
                          fontSize: "0.875rem",
                          textDecoration: "line-through",
                        }}
                      >
                        {bundle.compare_price
                          ? formatPrice(bundle.compare_price)
                          : "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: bundle.active
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(239,68,68,0.1)",
                            color: bundle.active ? "#10b981" : "#ef4444",
                          }}
                        >
                          {bundle.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => openEdit(bundle)}
                            style={{
                              background: "none",
                              border: "1px solid var(--gold-border)",
                              color: "var(--gold)",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bundle.id, bundle.name)}
                            disabled={deleting === bundle.id}
                            style={{
                              background: "none",
                              border: "1px solid rgba(239,68,68,0.3)",
                              color: "#ef4444",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                              opacity: deleting === bundle.id ? 0.5 : 1,
                            }}
                          >
                            <Trash2 size={13} />
                            {deleting === bundle.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "2rem 1rem",
            overflowY: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              margin: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {editingId ? "Edit Bundle" : "New Bundle"}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Bundle Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Bundle Name *
              </label>
              <input
                className="input-dark"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Bridal Essentials Set"
                style={{ width: "100%" }}
              />
            </div>

            {/* Slug */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                URL Slug
              </label>
              <input
                className="input-dark"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="bridal-essentials-set"
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.875rem" }}
              />
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>
                shopkrisha.com/bundles/{form.slug || "your-bundle-slug"}
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Description
              </label>
              <textarea
                className="input-dark"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Describe what makes this bundle special..."
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Image URL */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Bundle Image URL
              </label>
              <input
                className="input-dark"
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="https://... (optional — uses first product image if blank)"
                style={{ width: "100%" }}
              />
            </div>

            {/* Pricing row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Bundle Price ($) *
                </label>
                <input
                  className="input-dark"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.bundle_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bundle_price: e.target.value }))
                  }
                  placeholder="49.99"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Compare Price ($)
                </label>
                <input
                  className="input-dark"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compare_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, compare_price: e.target.value }))
                  }
                  placeholder="79.99 (crossed out)"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg)",
                border: "1px solid var(--gold-border)",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                  Active
                </p>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.78rem",
                    margin: "2px 0 0",
                  }}
                >
                  Show this bundle on the storefront
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, active: !f.active }))
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: form.active ? "var(--gold)" : "var(--muted)",
                  padding: 0,
                }}
              >
                {form.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            {/* Product selector */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Products ({form.product_ids.length} selected — min 2) *
              </label>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="input-dark"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  style={{ width: "100%", paddingLeft: "2.25rem" }}
                />
              </div>

              {productsLoading ? (
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
                  Loading products...
                </p>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--gold-border)",
                    borderRadius: "10px",
                    maxHeight: "240px",
                    overflowY: "auto",
                    background: "var(--bg)",
                  }}
                >
                  {filteredProducts.length === 0 ? (
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                        padding: "1rem",
                        textAlign: "center",
                      }}
                    >
                      {allProducts.length === 0
                        ? "No products found. Make sure products are loaded."
                        : "No products match your search."}
                    </p>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = form.product_ids.includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.65rem 0.85rem",
                            background: isSelected
                              ? "rgba(201,168,76,0.08)"
                              : "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--gold-border)",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "var(--text)",
                            transition: "background 0.15s",
                          }}
                        >
                          <span style={{ color: isSelected ? "var(--gold)" : "var(--muted)", flexShrink: 0 }}>
                            {isSelected ? (
                              <CheckSquare size={16} />
                            ) : (
                              <Square size={16} />
                            )}
                          </span>
                          {product.images?.[0] && (
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                flexShrink: 0,
                                position: "relative",
                                background: "var(--surface)",
                              }}
                            >
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="36px"
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 600,
                                fontSize: "0.84rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {product.name}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--muted)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {formatPrice(product.price)} ·{" "}
                              {product.stock_quantity > 0
                                ? `${product.stock_quantity} in stock`
                                : "Out of stock"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected products summary */}
            {selectedProducts.length > 0 && (
              <div
                style={{
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 0.5rem",
                  }}
                >
                  Selected Products ({selectedProducts.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {selectedProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.84rem",
                      }}
                    >
                      <span>{p.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                          {formatPrice(p.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleProduct(p.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--muted)",
                            padding: "0.1rem",
                            display: "inline-flex",
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      borderTop: "1px solid var(--gold-border)",
                      paddingTop: "0.5rem",
                      marginTop: "0.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>Individual total</span>
                    <span style={{ color: "var(--gold)" }}>
                      {formatPrice(
                        selectedProducts.reduce((s, p) => s + p.price, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeModal}
                className="btn-gold-outline"
                style={{ fontSize: "0.875rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-gold"
                style={{ fontSize: "0.875rem", opacity: saving ? 0.7 : 1 }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Bundle"
                  : "Create Bundle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
