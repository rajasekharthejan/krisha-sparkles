"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Warehouse, Save, AlertTriangle, Bell } from "lucide-react";
import type { Product } from "@/types";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .eq("active", true)
        .order("stock_quantity");
      setProducts((data as Product[]) || []);
      setLoading(false);
    }
    fetchProducts();

    // Fetch waitlist counts per product via admin API
    async function fetchWaitlistCounts() {
      try {
        const res = await fetch("/api/admin/back-in-stock/counts");
        if (res.ok) {
          const data = await res.json();
          setWaitlistCounts(data.counts || {});
        }
      } catch { /* non-critical */ }
    }
    fetchWaitlistCounts();
  }, []);

  function handleQtyChange(productId: string, value: string) {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setUpdates((prev) => ({ ...prev, [productId]: num }));
    }
  }

  async function saveQty(productId: string) {
    const newQty = updates[productId];
    if (newQty === undefined) return;
    setSaving((prev) => ({ ...prev, [productId]: true }));
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", productId);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock_quantity: newQty } : p))
    );
    setUpdates((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setSaving((prev) => ({ ...prev, [productId]: false }));
  }

  const outOfStock = products.filter((p) => p.stock_quantity === 0);
  const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5);
  const inStock = products.filter((p) => p.stock_quantity > 5);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>
          Inventory
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Manage stock levels for all products
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Products", value: products.length, color: "var(--gold)", bg: "var(--gold-muted)" },
          { label: "In Stock", value: inStock.length, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Low Stock", value: lowStock.length, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Out of Stock", value: outOfStock.length, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "10px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.label}</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", fontWeight: 700, color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
          Loading inventory...
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  <th>Waitlist</th>
                  <th>Update Qty</th>
                  <th>Save</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const currentValue = updates[product.id] ?? product.stock_quantity;
                  const hasChange = updates[product.id] !== undefined;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "var(--elevated)" }}>
                            {product.images?.[0] ? (
                              <Image src={product.images[0]} alt={product.name} width={40} height={40} style={{ objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>💎</div>
                            )}
                          </div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{product.category?.name || "—"}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-playfair)",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: product.stock_quantity === 0
                              ? "#ef4444"
                              : product.stock_quantity <= 5
                              ? "#f59e0b"
                              : "var(--gold)",
                          }}
                        >
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td>
                        {product.stock_quantity === 0 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#ef4444" }}>
                            <AlertTriangle size={12} /> Out of Stock
                          </span>
                        ) : product.stock_quantity <= 5 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#f59e0b" }}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#10b981" }}>✓ In Stock</span>
                        )}
                      </td>
                      <td>
                        {waitlistCounts[product.id] > 0 ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--gold)", fontWeight: 600 }}>
                            <Bell size={12} />
                            {waitlistCounts[product.id]}
                          </span>
                        ) : (
                          <span style={{ color: "var(--subtle)", fontSize: "0.78rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={currentValue}
                          onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          style={{
                            width: "80px",
                            padding: "0.4rem 0.6rem",
                            background: hasChange ? "rgba(201,168,76,0.08)" : "var(--elevated)",
                            border: `1px solid ${hasChange ? "var(--gold)" : "rgba(201,168,76,0.2)"}`,
                            borderRadius: "6px",
                            color: "var(--text)",
                            fontSize: "0.875rem",
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                      </td>
                      <td>
                        {hasChange && (
                          <button
                            onClick={() => saveQty(product.id)}
                            disabled={saving[product.id]}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              padding: "0.4rem 0.75rem",
                              background: "var(--gold-muted)",
                              color: "var(--gold)",
                              border: "1px solid var(--gold-border)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              transition: "all 0.2s",
                            }}
                          >
                            <Save size={12} />
                            {saving[product.id] ? "Saving..." : "Save"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
