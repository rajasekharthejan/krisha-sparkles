"use client";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@supabase/ssr";
import { TrendingUp, TrendingDown, Check, ChevronDown, Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  stock_quantity: number;
  active: boolean;
  images: string[];
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BulkPricePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [changeType, setChangeType] = useState<"percentage" | "fixed">("percentage");
  const [changeValue, setChangeValue] = useState("");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [alsoUpdateCompare, setAlsoUpdateCompare] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("id, name, price, compare_price, stock_quantity, active, images, category:categories(id, name)").order("name"),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setProducts((prods as unknown as Product[]) || []);
    setCategories(cats || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    if (filterCategory && p.category?.id !== filterCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function calcNewPrice(price: number): number {
    const val = parseFloat(changeValue) || 0;
    if (val <= 0) return price;
    let newPrice: number;
    if (changeType === "percentage") {
      newPrice = direction === "increase"
        ? price * (1 + val / 100)
        : price * (1 - val / 100);
    } else {
      newPrice = direction === "increase" ? price + val : price - val;
    }
    return Math.max(0.01, Math.round(newPrice * 100) / 100);
  }

  async function handleApply() {
    if (selectedIds.size === 0) return setError("Select at least one product");
    if (!changeValue || parseFloat(changeValue) <= 0) return setError("Enter a valid price change value");
    setError("");
    setSaving(true);

    const updates = Array.from(selectedIds).map((id) => {
      const product = products.find((p) => p.id === id)!;
      const newPrice = calcNewPrice(product.price);
      const update: Record<string, number | null> = { price: newPrice };
      if (alsoUpdateCompare && product.compare_price) {
        update.compare_price = calcNewPrice(product.compare_price);
      }
      return { id, ...update };
    });

    try {
      const res = await fetch("/api/admin/bulk-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setSuccess(`Successfully updated ${data.updated} product${data.updated !== 1 ? "s" : ""}`);
      setSelectedIds(new Set());
      setChangeValue("");
      setPreview(false);
      load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
    setSaving(false);
  }

  const selectedProducts = filtered.filter((p) => selectedIds.has(p.id));
  const val = parseFloat(changeValue) || 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            Bulk Price Update
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Select products and apply price changes in bulk
          </p>
        </div>

        {/* Price Change Controls */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem" }}>
            Price Adjustment
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
            {/* Direction */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Direction</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["increase", "decrease"] as const).map((d) => (
                  <button key={d} onClick={() => setDirection(d)} style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: `1px solid ${direction === d ? "var(--gold)" : "var(--gold-border)"}`, background: direction === d ? "var(--gold-muted)" : "transparent", color: direction === d ? "var(--gold)" : "var(--muted)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                    {d === "increase" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {d === "increase" ? "Increase" : "Decrease"}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Change Type</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["percentage", "fixed"] as const).map((t) => (
                  <button key={t} onClick={() => setChangeType(t)} style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: `1px solid ${changeType === t ? "var(--gold)" : "var(--gold-border)"}`, background: changeType === t ? "var(--gold-muted)" : "transparent", color: changeType === t ? "var(--gold)" : "var(--muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                    {t === "percentage" ? "% Percent" : "$ Fixed"}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                Amount {changeType === "percentage" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                value={changeValue}
                onChange={(e) => setChangeValue(e.target.value)}
                placeholder={changeType === "percentage" ? "e.g. 10" : "e.g. 5.00"}
                className="input-dark"
                min="0.01"
                step={changeType === "percentage" ? "1" : "0.01"}
              />
            </div>

            {/* Also update compare price */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.15rem" }}>
              <button
                onClick={() => setAlsoUpdateCompare((v) => !v)}
                style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1px solid ${alsoUpdateCompare ? "var(--gold)" : "var(--gold-border)"}`, background: alsoUpdateCompare ? "var(--gold)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {alsoUpdateCompare && <Check size={11} color="#000" />}
              </button>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Also update compare price</span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setError(""); setPreview(true); }}
                disabled={selectedIds.size === 0 || !changeValue}
                className="btn-gold-outline"
                style={{ flex: 1, fontSize: "0.8rem" }}
              >
                Preview ({selectedIds.size})
              </button>
              <button
                onClick={handleApply}
                disabled={saving || selectedIds.size === 0 || !changeValue}
                className="btn-gold"
                style={{ flex: 1, fontSize: "0.8rem" }}
              >
                {saving ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>

          {/* Status messages */}
          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "1rem", padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "8px" }}>{error}</p>}
          {success && <p style={{ color: "#10b981", fontSize: "0.875rem", marginTop: "1rem", padding: "0.75rem", background: "rgba(16,185,129,0.1)", borderRadius: "8px" }}>{success}</p>}
        </div>

        {/* Preview Modal */}
        {preview && selectedProducts.length > 0 && val > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--gold)" }}>
                Preview — {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} will be updated
              </h3>
              <button onClick={() => setPreview(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Price</th>
                    <th>→ New Price</th>
                    {alsoUpdateCompare && <th>Compare Price</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((p) => {
                    const newP = calcNewPrice(p.price);
                    const newC = alsoUpdateCompare && p.compare_price ? calcNewPrice(p.compare_price) : null;
                    const isIncrease = newP > p.price;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: "var(--muted)" }}>${p.price.toFixed(2)}</td>
                        <td>
                          <span style={{ color: isIncrease ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                            ${newP.toFixed(2)}
                          </span>
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>
                            ({isIncrease ? "+" : ""}{((newP - p.price) / p.price * 100).toFixed(1)}%)
                          </span>
                        </td>
                        {alsoUpdateCompare && (
                          <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                            {p.compare_price && newC ? (
                              <span>${p.compare_price.toFixed(2)} → ${newC.toFixed(2)}</span>
                            ) : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.75rem" }}>
              <button onClick={() => setPreview(false)} className="btn-gold-outline" style={{ fontSize: "0.875rem" }}>Cancel</button>
              <button onClick={handleApply} disabled={saving} className="btn-gold" style={{ fontSize: "0.875rem" }}>
                {saving ? "Applying..." : `Confirm & Apply to ${selectedProducts.length} Products`}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-dark"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-dark"
              style={{ appearance: "none", paddingRight: "2rem" }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          </div>
          <button
            onClick={toggleAll}
            className="btn-gold-outline"
            style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : `Select All (${filtered.length})`}
          </button>
        </div>

        {/* Products Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading products...</div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <button
                      onClick={toggleAll}
                      style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1px solid ${selectedIds.size === filtered.length && filtered.length > 0 ? "var(--gold)" : "var(--gold-border)"}`, background: selectedIds.size === filtered.length && filtered.length > 0 ? "var(--gold)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {selectedIds.size === filtered.length && filtered.length > 0 && <Check size={11} color="#000" />}
                    </button>
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Price</th>
                  <th>Compare Price</th>
                  {val > 0 && <th style={{ color: "var(--gold)" }}>New Price</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const selected = selectedIds.has(p.id);
                  const newP = val > 0 && selected ? calcNewPrice(p.price) : null;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggleOne(p.id)}
                      style={{ cursor: "pointer", background: selected ? "rgba(201,168,76,0.04)" : undefined }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleOne(p.id)}
                          style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1px solid ${selected ? "var(--gold)" : "var(--gold-border)"}`, background: selected ? "var(--gold)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {selected && <Check size={11} color="#000" />}
                        </button>
                      </td>
                      <td>
                        <p style={{ fontWeight: 500, fontSize: "0.875rem", margin: 0 }}>{p.name}</p>
                        {!p.active && <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>Inactive</span>}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{p.category?.name || "—"}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 700 }}>${p.price.toFixed(2)}</td>
                      <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {p.compare_price ? `$${p.compare_price.toFixed(2)}` : "—"}
                      </td>
                      {val > 0 && (
                        <td>
                          {newP !== null ? (
                            <span style={{ color: newP > p.price ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                              ${newP.toFixed(2)}
                            </span>
                          ) : <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>No products found</div>
            )}
          </div>
        )}

        <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
          {selectedIds.size} of {filtered.length} products selected
        </p>
      </main>
    </div>
  );
}
