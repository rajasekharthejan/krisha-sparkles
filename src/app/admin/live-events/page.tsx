"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Search,
  X,
  Play,
  Square as StopIcon,
  Clock,
  CheckSquare,
  Square as SquareIcon,
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

interface EventProduct {
  product_id: string;
  special_price: number | null;
}

interface LiveEventRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  thumbnail: string | null;
  status: "scheduled" | "live" | "ended";
  scheduled_at: string | null;
  discount_code: string | null;
  discount_label: string | null;
  created_at: string;
  products: EventProduct[];
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  video_url: string;
  thumbnail: string;
  scheduled_at: string;
  discount_code: string;
  discount_label: string;
  products: EventProduct[];
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  video_url: "",
  thumbnail: "",
  scheduled_at: "",
  discount_code: "",
  discount_label: "",
  products: [],
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminLiveEventsPage() {
  const [events, setEvents] = useState<LiveEventRecord[]>([]);
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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/live-events");
      if (res.ok) {
        const json = await res.json();
        setEvents(json.events || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadProducts = useCallback(async () => {
    if (allProducts.length > 0) return; // already loaded
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products/list");
      if (res.ok) {
        const json = await res.json();
        setAllProducts(json.products || []);
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

  function openEdit(event: LiveEventRecord) {
    setForm({
      title: event.title,
      slug: event.slug,
      description: event.description || "",
      video_url: event.video_url || "",
      thumbnail: event.thumbnail || "",
      scheduled_at: event.scheduled_at
        ? new Date(event.scheduled_at).toISOString().slice(0, 16)
        : "",
      discount_code: event.discount_code || "",
      discount_label: event.discount_label || "",
      products: event.products || [],
    });
    setEditingId(event.id);
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

  // Auto-generate slug when title changes (only in create mode)
  function handleTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: editingId ? f.slug : slugify(value),
    }));
  }

  function toggleProduct(productId: string) {
    setForm((f) => {
      const exists = f.products.find((p) => p.product_id === productId);
      return {
        ...f,
        products: exists
          ? f.products.filter((p) => p.product_id !== productId)
          : [...f.products, { product_id: productId, special_price: null }],
      };
    });
  }

  function setSpecialPrice(productId: string, value: string) {
    setForm((f) => ({
      ...f,
      products: f.products.map((p) =>
        p.product_id === productId
          ? { ...p, special_price: value ? Number(value) : null }
          : p
      ),
    }));
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async function handleSave() {
    setError("");
    if (!form.title.trim()) return setError("Event title is required");

    setSaving(true);
    try {
      const body = {
        id: editingId || undefined,
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description.trim() || undefined,
        video_url: form.video_url.trim() || undefined,
        thumbnail: form.thumbnail.trim() || undefined,
        scheduled_at: form.scheduled_at || undefined,
        discount_code: form.discount_code.trim() || undefined,
        discount_label: form.discount_label.trim() || undefined,
        products: form.products,
      };

      const res = await fetch("/api/admin/live-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save event");
      } else {
        closeModal();
        loadEvents();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(
        `/api/admin/live-events?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setEvents((e) => e.filter((x) => x.id !== id));
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete event");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatusChange(
    id: string,
    newStatus: "live" | "ended"
  ) {
    try {
      const res = await fetch(`/api/admin/live-events/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadEvents();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update status");
      }
    } catch {
      alert("Network error updating status");
    }
  }

  // ---------------------------------------------------------------------------
  // Filtered products for search
  // ---------------------------------------------------------------------------

  const filteredProducts = allProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedProductIds = form.products.map((p) => p.product_id);
  const selectedProducts = allProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  // ---------------------------------------------------------------------------
  // Status badge helper
  // ---------------------------------------------------------------------------

  function statusBadge(status: string) {
    const styles: Record<string, { bg: string; color: string; extra?: string }> = {
      scheduled: {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
      },
      live: {
        bg: "rgba(16,185,129,0.1)",
        color: "#10b981",
      },
      ended: {
        bg: "rgba(156,163,175,0.1)",
        color: "#9ca3af",
      },
    };

    const s = styles[status] || styles.ended;

    return (
      <span
        style={{
          padding: "0.2rem 0.6rem",
          borderRadius: "9999px",
          fontSize: "0.72rem",
          fontWeight: 600,
          background: s.bg,
          color: s.color,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        {status === "live" && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        )}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: "2rem" }}>
      {/* Pulse animation for live badge */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>

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
            Live Events
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.875rem",
              marginTop: "0.25rem",
            }}
          >
            {events.length} event{events.length !== 1 ? "s" : ""} configured
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
          New Event
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
          Loading events...
        </div>
      ) : events.length === 0 ? (
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
          <Video
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
            No live events yet
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            Create your first live shopping event to engage customers in
            real-time.
          </p>
          <button onClick={openCreate} className="btn-gold">
            Create First Event
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
                  <th>Event</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
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
                          {event.thumbnail ? (
                            <Image
                              src={event.thumbnail}
                              alt={event.title}
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
                              <Video size={20} strokeWidth={1} />
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
                            {event.title}
                          </p>
                          <p
                            style={{
                              color: "var(--muted)",
                              fontSize: "0.75rem",
                              margin: "2px 0 0",
                              fontFamily: "monospace",
                            }}
                          >
                            /live/{event.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{statusBadge(event.status)}</td>
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatDate(event.scheduled_at)}
                    </td>
                    <td
                      style={{
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {event.products?.length || 0} product
                      {(event.products?.length || 0) !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Go Live / End button */}
                        {event.status === "scheduled" && (
                          <button
                            onClick={() =>
                              handleStatusChange(event.id, "live")
                            }
                            style={{
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              color: "#10b981",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            <Play size={13} />
                            Go Live
                          </button>
                        )}
                        {event.status === "live" && (
                          <button
                            onClick={() =>
                              handleStatusChange(event.id, "ended")
                            }
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              color: "#ef4444",
                              borderRadius: "6px",
                              padding: "0.35rem 0.6rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            <StopIcon size={13} />
                            End
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(event)}
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

                        {/* Delete */}
                        <button
                          onClick={() =>
                            handleDelete(event.id, event.title)
                          }
                          disabled={deleting === event.id}
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
                            opacity: deleting === event.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                          {deleting === event.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {editingId ? "Edit Event" : "New Event"}
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

            {/* Title */}
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
                Event Title *
              </label>
              <input
                className="input-dark"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Friday Night Flash Sale"
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
                placeholder="friday-night-flash-sale"
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              />
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.75rem",
                  marginTop: "0.3rem",
                }}
              >
                shopkrisha.com/live/{form.slug || "your-event-slug"}
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
                placeholder="Describe what this live event is about..."
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Video URL + Thumbnail row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
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
                  Video URL
                </label>
                <input
                  className="input-dark"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, video_url: e.target.value }))
                  }
                  placeholder="https://youtube.com/..."
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
                  Thumbnail URL
                </label>
                <input
                  className="input-dark"
                  value={form.thumbnail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thumbnail: e.target.value }))
                  }
                  placeholder="https://... (optional)"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Scheduled At */}
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
                <Clock
                  size={12}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: "0.35rem",
                  }}
                />
                Scheduled Date & Time
              </label>
              <input
                className="input-dark"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduled_at: e.target.value }))
                }
                style={{ width: "100%" }}
              />
            </div>

            {/* Discount Code + Label row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
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
                  Discount Code
                </label>
                <input
                  className="input-dark"
                  value={form.discount_code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_code: e.target.value,
                    }))
                  }
                  placeholder="e.g. LIVE20"
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                  }}
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
                  Discount Label
                </label>
                <input
                  className="input-dark"
                  value={form.discount_label}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_label: e.target.value,
                    }))
                  }
                  placeholder="e.g. 20% off live only!"
                  style={{ width: "100%" }}
                />
              </div>
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
                Featured Products ({form.products.length} selected)
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
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.875rem",
                    padding: "1rem 0",
                  }}
                >
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
                      const isSelected = selectedProductIds.includes(
                        product.id
                      );
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
                          <span
                            style={{
                              color: isSelected
                                ? "var(--gold)"
                                : "var(--muted)",
                              flexShrink: 0,
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare size={16} />
                            ) : (
                              <SquareIcon size={16} />
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

            {/* Selected products summary with special price */}
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
                  Featured Products ({selectedProducts.length})
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {selectedProducts.map((p) => {
                    const eventProduct = form.products.find(
                      (ep) => ep.product_id === p.id
                    );
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.84rem",
                          gap: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.name}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatPrice(p.price)}
                          </span>
                          <input
                            className="input-dark"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Special $"
                            value={eventProduct?.special_price ?? ""}
                            onChange={(e) =>
                              setSpecialPrice(p.id, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "90px",
                              fontSize: "0.78rem",
                              padding: "0.3rem 0.5rem",
                              textAlign: "right",
                            }}
                          />
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
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
                style={{
                  fontSize: "0.875rem",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Event"
                  : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
