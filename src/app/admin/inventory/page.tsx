"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Warehouse, Save, AlertTriangle, Bell, Minus, ChevronDown, ChevronRight, ShoppingBag, Package } from "lucide-react";
import type { Product } from "@/types";

type Mode = "set" | "sale";

interface VariantRow {
  key: string;      // e.g. "40" or "40-Red"
  stock: number;
}

interface ProductRow extends Product {
  variantRows: VariantRow[];
}

function buildVariantRows(p: Product): VariantRow[] {
  if (!p.variant_stock || Object.keys(p.variant_stock).length === 0) return [];
  return Object.entries(p.variant_stock).map(([key, stock]) => ({ key, stock }));
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("sale");          // default: record offline sale
  const [saleInputs, setSaleInputs] = useState<Record<string, number>>({});  // productId|variantKey → qty sold
  const [setInputs, setSetInputs] = useState<Record<string, number>>({});    // productId|variantKey → new total
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("active", true)
      .order("stock_quantity")
      .then(({ data }) => {
        const rows = ((data as Product[]) || []).map((p) => ({
          ...p,
          variantRows: buildVariantRows(p),
        }));
        setProducts(rows);
        setLoading(false);
      });

    fetch("/api/admin/back-in-stock/counts")
      .then((r) => r.ok ? r.json() : { counts: {} })
      .then((d) => setWaitlistCounts(d.counts || {}))
      .catch(() => {});
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function rowKey(productId: string, variantKey?: string) {
    return variantKey ? `${productId}|${variantKey}` : productId;
  }

  function getSaleInput(productId: string, variantKey?: string) {
    return saleInputs[rowKey(productId, variantKey)] ?? 0;
  }

  function getSetInput(productId: string, stock: number, variantKey?: string) {
    const k = rowKey(productId, variantKey);
    return setInputs[k] !== undefined ? setInputs[k] : stock;
  }

  function setSaleInput(productId: string, val: number, variantKey?: string) {
    setSaleInputs((prev) => ({ ...prev, [rowKey(productId, variantKey)]: Math.max(0, val) }));
  }

  function setSetInput(productId: string, val: number, variantKey?: string) {
    setSetInputs((prev) => ({ ...prev, [rowKey(productId, variantKey)]: Math.max(0, val) }));
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function save(productId: string, currentStock: number, variantKey?: string) {
    const rk = rowKey(productId, variantKey);
    setSaving((prev) => ({ ...prev, [rk]: true }));

    const supabase = createClient();
    const product = products.find((p) => p.id === productId)!;

    let newStock: number;
    if (mode === "sale") {
      const sold = getSaleInput(productId, variantKey);
      newStock = Math.max(0, currentStock - sold);
    } else {
      newStock = getSetInput(productId, currentStock, variantKey);
    }

    // Build DB update
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (variantKey) {
      // Update per-variant stock AND recalculate total stock_quantity
      const newVariantStock = { ...(product.variant_stock || {}), [variantKey]: newStock };
      const newTotal = Object.values(newVariantStock).reduce((s, n) => s + n, 0);
      updatePayload.variant_stock = newVariantStock;
      updatePayload.stock_quantity = newTotal;

      await supabase.from("products").update(updatePayload).eq("id", productId);

      // Update local state
      setProducts((prev) => prev.map((p) => {
        if (p.id !== productId) return p;
        const vs = { ...(p.variant_stock || {}), [variantKey]: newStock };
        return {
          ...p,
          variant_stock: vs,
          stock_quantity: Object.values(vs).reduce((s, n) => s + n, 0),
          variantRows: buildVariantRows({ ...p, variant_stock: vs }),
        };
      }));
    } else {
      // Update global stock only (no variants)
      updatePayload.stock_quantity = newStock;
      await supabase.from("products").update(updatePayload).eq("id", productId);

      setProducts((prev) => prev.map((p) =>
        p.id === productId ? { ...p, stock_quantity: newStock } : p
      ));
    }

    // Reset inputs and flash saved
    if (mode === "sale") {
      setSaleInputs((prev) => { const n = { ...prev }; delete n[rk]; return n; });
    } else {
      setSetInputs((prev) => { const n = { ...prev }; delete n[rk]; return n; });
    }
    setSaving((prev) => ({ ...prev, [rk]: false }));
    setSaved((prev) => ({ ...prev, [rk]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [rk]: false })), 2000);
  }

  // ── Stock badge ───────────────────────────────────────────────────────────
  function stockColor(qty: number) {
    if (qty === 0) return "#ef4444";
    if (qty <= 5) return "#f59e0b";
    return "#10b981";
  }

  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const inStock = products.filter((p) => p.stock_quantity > 5).length;

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Warehouse size={22} style={{ color: "var(--gold)" }} /> Inventory
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Update stock after offline sales or restocking
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", background: "var(--elevated)", border: "1px solid var(--gold-border)", borderRadius: "8px", padding: "3px", gap: "3px" }}>
          {([
            { id: "sale", icon: <ShoppingBag size={14} />, label: "Record Offline Sale" },
            { id: "set",  icon: <Package size={14} />,     label: "Set Stock Total" },
          ] as { id: Mode; icon: React.ReactNode; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.85rem", borderRadius: "6px", border: "none", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: 600, transition: "all 0.15s",
                background: mode === tab.id ? "var(--gold)" : "transparent",
                color: mode === tab.id ? "#000" : "var(--muted)",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode hint */}
      <div style={{
        background: mode === "sale" ? "rgba(201,168,76,0.06)" : "rgba(16,185,129,0.05)",
        border: `1px solid ${mode === "sale" ? "rgba(201,168,76,0.2)" : "rgba(16,185,129,0.15)"}`,
        borderRadius: "8px", padding: "0.65rem 1rem", marginBottom: "1.5rem",
        fontSize: "0.8rem", color: "var(--muted)", display: "flex", gap: "0.5rem", alignItems: "center",
      }}>
        {mode === "sale"
          ? <><ShoppingBag size={13} style={{ color: "var(--gold)", flexShrink: 0 }} /> <span><strong style={{ color: "var(--text)" }}>Record Offline Sale</strong> — Enter how many you sold. Stock automatically decreases by that amount.</span></>
          : <><Package size={13} style={{ color: "#10b981", flexShrink: 0 }} /> <strong style={{ color: "var(--text)" }}>Set Stock Total</strong> — Enter the new total on-hand quantity for each product.</>
        }
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Products", value: products.length, color: "var(--gold)" },
          { label: "In Stock (>5)",  value: inStock,          color: "#10b981" },
          { label: "Low Stock",      value: lowStock,          color: "#f59e0b" },
          { label: "Out of Stock",   value: outOfStock,        color: "#ef4444" },
        ].map((c, i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{c.label}</p>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {products.map((product) => {
            const hasVariants = product.variantRows.length > 0;
            const isExpanded = expanded[product.id];

            return (
              <div key={product.id} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "10px", overflow: "hidden" }}>

                {/* Product row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "0.875rem 1rem", gap: "0.75rem" }}>
                  {/* Left: image + name + category */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    {hasVariants && (
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [product.id]: !p[product.id] }))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", padding: 0, flexShrink: 0 }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                    <div style={{ width: "44px", height: "44px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "var(--elevated)" }}>
                      {product.images?.[0]
                        ? <Image src={product.images[0]} alt={product.name} width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>💎</div>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{product.category?.name || "—"}</span>
                        {hasVariants && (
                          <span style={{ fontSize: "0.7rem", color: "var(--subtle)", background: "var(--elevated)", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
                            {product.variantRows.length} variants — click to manage
                          </span>
                        )}
                        {waitlistCounts[product.id] > 0 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--gold)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Bell size={10} /> {waitlistCounts[product.id]} waiting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: stock + controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    {/* Current stock badge */}
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.4rem", fontWeight: 700, color: stockColor(product.stock_quantity) }}>
                        {product.stock_quantity}
                      </span>
                      <p style={{ fontSize: "0.65rem", color: "var(--subtle)", marginTop: "-2px" }}>in stock</p>
                    </div>

                    {/* Controls — only show for non-variant products here */}
                    {!hasVariants && (
                      <StockControl
                        mode={mode}
                        currentStock={product.stock_quantity}
                        saleVal={getSaleInput(product.id)}
                        setVal={getSetInput(product.id, product.stock_quantity)}
                        onSaleChange={(v) => setSaleInput(product.id, v)}
                        onSetChange={(v) => setSetInput(product.id, v)}
                        onSave={() => save(product.id, product.stock_quantity)}
                        saving={saving[product.id]}
                        saved={saved[product.id]}
                      />
                    )}

                    {hasVariants && !isExpanded && (
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [product.id]: true }))}
                        style={{ fontSize: "0.75rem", color: "var(--gold)", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", borderRadius: "6px", padding: "0.35rem 0.75rem", cursor: "pointer", fontWeight: 600 }}
                      >
                        Manage Variants
                      </button>
                    )}
                  </div>
                </div>

                {/* Variant rows (expanded) */}
                {hasVariants && isExpanded && (
                  <div style={{ borderTop: "1px solid rgba(201,168,76,0.12)", background: "var(--elevated)" }}>
                    {product.variantRows.map((vr) => {
                      const rk = rowKey(product.id, vr.key);
                      return (
                        <div
                          key={vr.key}
                          style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "0.65rem 1rem 0.65rem 3.5rem", borderBottom: "1px solid rgba(201,168,76,0.06)", gap: "0.75rem" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gold)", minWidth: "60px" }}>
                              Size {vr.key}
                            </span>
                            <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, color: stockColor(vr.stock) }}>
                              {vr.stock}
                            </span>
                            <span style={{ fontSize: "0.68rem", color: "var(--subtle)" }}>
                              {vr.stock === 0 ? "Sold Out" : vr.stock <= 3 ? "Low" : "In Stock"}
                            </span>
                          </div>

                          <StockControl
                            mode={mode}
                            currentStock={vr.stock}
                            saleVal={getSaleInput(product.id, vr.key)}
                            setVal={getSetInput(product.id, vr.stock, vr.key)}
                            onSaleChange={(v) => setSaleInput(product.id, v, vr.key)}
                            onSetChange={(v) => setSetInput(product.id, v, vr.key)}
                            onSave={() => save(product.id, vr.stock, vr.key)}
                            saving={saving[rk]}
                            saved={saved[rk]}
                          />
                        </div>
                      );
                    })}
                    <div style={{ padding: "0.5rem 1rem 0.5rem 3.5rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--subtle)" }}>
                        Total: {product.stock_quantity} units across {product.variantRows.length} variants
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Reusable stock control component ──────────────────────────────────────────
interface StockControlProps {
  mode: Mode;
  currentStock: number;
  saleVal: number;
  setVal: number;
  onSaleChange: (v: number) => void;
  onSetChange: (v: number) => void;
  onSave: () => void;
  saving?: boolean;
  saved?: boolean;
}

function StockControl({ mode, currentStock, saleVal, setVal, onSaleChange, onSetChange, onSave, saving, saved }: StockControlProps) {
  const hasSaleInput = saleVal > 0;
  const hasSetChange = setVal !== currentStock;
  const hasChange = mode === "sale" ? hasSaleInput : hasSetChange;

  if (mode === "sale") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {/* Quick decrement buttons */}
        <button
          onClick={() => { onSaleChange(1); }}
          title="Sold 1"
          style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid rgba(201,168,76,0.2)", background: "var(--elevated)", color: "var(--muted)", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Minus size={10} />1
        </button>
        <button
          onClick={() => { onSaleChange(5); }}
          title="Sold 5"
          style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid rgba(201,168,76,0.2)", background: "var(--elevated)", color: "var(--muted)", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Minus size={10} />5
        </button>

        {/* Sold qty input */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "7px", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "var(--muted)", pointerEvents: "none" }}>sold</span>
          <input
            type="number"
            min="0"
            max={currentStock}
            value={saleVal || ""}
            placeholder="0"
            onChange={(e) => onSaleChange(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && hasChange && onSave()}
            style={{
              width: "72px", padding: "0.35rem 0.4rem 0.35rem 32px",
              background: hasSaleInput ? "rgba(239,68,68,0.08)" : "var(--elevated)",
              border: `1px solid ${hasSaleInput ? "#ef4444" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "6px", color: hasSaleInput ? "#ef4444" : "var(--text)",
              fontSize: "0.875rem", fontWeight: 600, textAlign: "right",
            }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={!hasChange || saving}
          style={{
            padding: "0.35rem 0.65rem", borderRadius: "6px", border: "none", cursor: hasChange ? "pointer" : "default",
            background: saved ? "rgba(16,185,129,0.15)" : hasChange ? "#ef4444" : "var(--elevated)",
            color: saved ? "#10b981" : hasChange ? "#fff" : "var(--subtle)",
            fontSize: "0.72rem", fontWeight: 700, transition: "all 0.2s", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: "0.25rem",
          }}
        >
          {saved ? "✓ Saved" : saving ? "…" : hasChange ? <><Save size={11} /> Deduct</> : <Save size={11} />}
        </button>
      </div>
    );
  }

  // Set mode
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <input
        type="number"
        min="0"
        value={setVal}
        onChange={(e) => onSetChange(parseInt(e.target.value) || 0)}
        onKeyDown={(e) => e.key === "Enter" && hasChange && onSave()}
        style={{
          width: "70px", padding: "0.35rem 0.5rem", textAlign: "center",
          background: hasSetChange ? "rgba(201,168,76,0.08)" : "var(--elevated)",
          border: `1px solid ${hasSetChange ? "var(--gold)" : "rgba(201,168,76,0.2)"}`,
          borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem",
        }}
      />
      <button
        onClick={onSave}
        disabled={!hasChange || saving}
        style={{
          padding: "0.35rem 0.65rem", borderRadius: "6px", border: "none", cursor: hasChange ? "pointer" : "default",
          background: saved ? "rgba(16,185,129,0.15)" : hasChange ? "var(--gold)" : "var(--elevated)",
          color: saved ? "#10b981" : hasChange ? "#000" : "var(--subtle)",
          fontSize: "0.72rem", fontWeight: 700, transition: "all 0.2s",
          display: "flex", alignItems: "center", gap: "0.25rem",
        }}
      >
        {saved ? "✓ Saved" : saving ? "…" : <><Save size={11} /> Set</>}
      </button>
    </div>
  );
}
