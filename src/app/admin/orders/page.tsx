"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingCart, ChevronDown, Truck, X, Loader2, Eye, Archive, Package, Printer, CheckCircle, ChevronRight } from "lucide-react";
import type { Order } from "@/types";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

const statusStyle = (status: string) => {
  const map: Record<string, { color: string; bg: string }> = {
    pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    paid:      { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    shipped:   { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    delivered: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };
  return map[status] || { color: "var(--muted)", bg: "rgba(255,255,255,0.05)" };
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Shippo label state
  const [labelOrderId, setLabelOrderId] = useState<string | null>(null);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);
  const [shippoStep, setShippoStep] = useState<"parcel" | "rates" | "buying" | "done">("parcel");
  const [parcel, setParcel] = useState({ weight_oz: "8", length_in: "6", width_in: "4", height_in: "2" });
  const [rates, setRates] = useState<Array<{ object_id: string; provider: string; servicelevel: { name: string }; amount: string; currency: string; estimated_days: number | null }>>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [shippoLoading, setShippoLoading] = useState(false);
  const [shippoError, setShippoError] = useState("");
  const [labelResult, setLabelResult] = useState<{ tracking_number: string; tracking_url: string; label_url: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (showArchived) params.set("archived", "true");
    const res = await fetch(`/api/admin/orders/list?${params}`);
    const json = await res.json();
    setOrders((json.orders as Order[]) || []);
    setLoading(false);
  }, [filter, showArchived]);

  async function archiveAll() {
    if (!confirm(`Archive all ${filter === "all" ? "" : filter + " "}orders? They will be hidden from default view.`)) return;
    setArchiving(true);
    const body = filter !== "all" ? { status: filter } : {};
    await fetch("/api/admin/orders/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setArchiving(false);
    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    await fetch("/api/admin/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o
      )
    );
    setUpdatingId(null);
  }

  async function saveTracking() {
    if (!trackingOrderId || !trackingNumber.trim()) return;
    setTrackingLoading(true);
    await fetch("/api/admin/orders/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: trackingOrderId,
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim() || null,
      }),
    });
    setOrders((prev) =>
      prev.map((o) =>
        o.id === trackingOrderId
          ? { ...o, tracking_number: trackingNumber.trim(), tracking_url: trackingUrl.trim() || undefined, status: "shipped" }
          : o
      )
    );
    setTrackingOrderId(null);
    setTrackingNumber("");
    setTrackingUrl("");
    setTrackingLoading(false);
  }

  function openShippoModal(order: Order) {
    setLabelOrderId(order.id);
    setLabelOrder(order);
    setShippoStep("parcel");
    setRates([]);
    setSelectedRateId("");
    setShippoError("");
    setLabelResult(null);
  }

  function closeShippoModal() {
    setLabelOrderId(null);
    setLabelOrder(null);
    setShippoStep("parcel");
    setRates([]);
    setShippoError("");
    setLabelResult(null);
  }

  async function fetchRates() {
    if (!labelOrderId) return;
    setShippoLoading(true);
    setShippoError("");
    try {
      const res = await fetch("/api/admin/shippo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: labelOrderId, ...parcel }),
      });
      const data = await res.json();
      if (!res.ok) { setShippoError(data.error || "Failed to get rates"); setShippoLoading(false); return; }
      setRates(data.rates || []);
      setSelectedRateId(data.rates?.[0]?.object_id || "");
      setShippoStep("rates");
    } catch { setShippoError("Network error. Please try again."); }
    setShippoLoading(false);
  }

  async function buyLabel() {
    if (!labelOrderId || !selectedRateId) return;
    setShippoStep("buying");
    setShippoError("");
    try {
      const res = await fetch("/api/admin/shippo/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: labelOrderId, rate_id: selectedRateId }),
      });
      const data = await res.json();
      if (!res.ok) { setShippoError(data.error || "Failed to purchase label"); setShippoStep("rates"); return; }
      setLabelResult(data);
      setShippoStep("done");
      // Update order in local list
      setOrders((prev) => prev.map((o) =>
        o.id === labelOrderId ? { ...o, tracking_number: data.tracking_number, tracking_url: data.tracking_url, status: "shipped" as Order["status"] } : o
      ));
    } catch { setShippoError("Network error."); setShippoStep("rates"); }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>Orders</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{orders.length} orders</p>
        </div>
        {/* Actions + Filter */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => setShowArchived((v) => { fetchOrders(); return !v; })}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.25)", background: showArchived ? "rgba(201,168,76,0.12)" : "transparent", color: showArchived ? "var(--gold)" : "var(--muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Archive size={13} /> {showArchived ? "Hide Archived" : "View Archived"}
          </button>
          <button
            onClick={archiveAll}
            disabled={archiving}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
          >
            {archiving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Archive size={13} />}
            Archive {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["all", ...STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                border: "1px solid",
                borderColor: filter === status ? "var(--gold)" : "rgba(201,168,76,0.2)",
                background: filter === status ? "var(--gold-muted)" : "transparent",
                color: filter === status ? "var(--gold)" : "var(--muted)",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "capitalize",
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <ShoppingCart size={48} style={{ opacity: 0.3, color: "var(--muted)" }} strokeWidth={1} />
            <p style={{ color: "var(--muted)" }}>No orders found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Tracking</th>
                  <th>Update Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = statusStyle(order.status);
                  const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  return (
                    <tr key={order.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/orders/${order.id}`)}>
                      <td style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "monospace" }}>
                        #{order.id.slice(0, 8)}
                      </td>
                      <td>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{order.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{order.email}</p>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </td>
                      <td style={{ color: "var(--gold)", fontWeight: 700 }}>{formatPrice(order.total)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ color: badge.color, background: badge.bg }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(order.created_at)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {order.tracking_number ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#3b82f6" }}>{order.tracking_number}</span>
                            {(order as Order & { label_url?: string }).label_url && (
                              <a
                                href={(order as Order & { label_url?: string }).label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--gold)", textDecoration: "none" }}
                              >
                                <Printer size={10} /> Print Label
                              </a>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {["paid", "pending"].includes(order.status) && (
                              <button
                                onClick={() => openShippoModal(order)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "0.3rem",
                                  padding: "0.35rem 0.65rem", borderRadius: "6px",
                                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                                  color: "#10b981", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
                                }}
                              >
                                <Package size={11} /> Create Label
                              </button>
                            )}
                            <button
                              onClick={() => { setTrackingOrderId(order.id); setTrackingNumber(""); setTrackingUrl(""); }}
                              style={{
                                display: "flex", alignItems: "center", gap: "0.3rem",
                                padding: "0.35rem 0.65rem", borderRadius: "6px",
                                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)",
                                color: "#3b82f6", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
                              }}
                            >
                              <Truck size={11} /> Manual
                            </button>
                          </div>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: "relative" }}>
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            style={{
                              padding: "0.4rem 2rem 0.4rem 0.75rem",
                              background: "var(--elevated)",
                              border: "1px solid rgba(201,168,76,0.2)",
                              borderRadius: "6px",
                              color: "var(--text)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              appearance: "none",
                              outline: "none",
                            }}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--muted)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.65rem", borderRadius: "6px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--gold)", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
                        >
                          <Eye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Shippo Label Modal ─────────────────────────────────────── */}
      {labelOrderId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget && shippoStep !== "buying") closeShippoModal(); }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "520px", animation: "zoomIn 0.2s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={18} style={{ color: "var(--gold)" }} />
                {shippoStep === "done" ? "Label Ready!" : "Create Shipping Label"}
              </h2>
              {shippoStep !== "buying" && (
                <button onClick={closeShippoModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><X size={18} /></button>
              )}
            </div>

            {/* Steps indicator */}
            {shippoStep !== "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.72rem", color: "var(--muted)" }}>
                <span style={{ color: "parcel" === shippoStep || shippoStep === "rates" || shippoStep === "buying" ? "var(--gold)" : "var(--muted)", fontWeight: 600 }}>1. Package</span>
                <ChevronRight size={12} />
                <span style={{ color: shippoStep === "rates" || shippoStep === "buying" ? "var(--gold)" : "var(--muted)", fontWeight: shippoStep === "rates" ? 600 : 400 }}>2. Select Rate</span>
                <ChevronRight size={12} />
                <span style={{ color: shippoStep === "buying" ? "var(--gold)" : "var(--muted)" }}>3. Buy Label</span>
              </div>
            )}

            {/* Shipping to info */}
            {labelOrder?.shipping_address && (
              <div style={{ background: "var(--elevated)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                <strong style={{ color: "var(--text)" }}>Ship to:</strong> {labelOrder.name} · {(labelOrder.shipping_address as { line1?: string; city?: string; state?: string; postal_code?: string }).line1}, {(labelOrder.shipping_address as { city?: string }).city}, {(labelOrder.shipping_address as { state?: string }).state} {(labelOrder.shipping_address as { postal_code?: string }).postal_code}
              </div>
            )}

            {shippoError && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#ef4444", fontSize: "0.8rem" }}>
                {shippoError}
              </div>
            )}

            {/* STEP 1: Parcel dimensions */}
            {shippoStep === "parcel" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                  Enter package details. Default values work for most jewelry shipments.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { key: "weight_oz", label: "Weight (oz)", placeholder: "8" },
                    { key: "length_in", label: "Length (in)", placeholder: "6" },
                    { key: "width_in",  label: "Width (in)",  placeholder: "4" },
                    { key: "height_in", label: "Height (in)", placeholder: "2" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", display: "block", marginBottom: "0.35rem" }}>{label}</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={parcel[key as keyof typeof parcel]}
                        onChange={(e) => setParcel((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="input-dark"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button onClick={closeShippoModal} className="btn-gold-outline" style={{ flex: 1 }}>Cancel</button>
                  <button
                    onClick={fetchRates}
                    disabled={shippoLoading}
                    className="btn-gold"
                    style={{ flex: 2, justifyContent: "center" }}
                  >
                    {shippoLoading
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Getting Rates...</>
                      : <><ChevronRight size={14} /> Get Shipping Rates</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select rate */}
            {shippoStep === "rates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>Select a shipping service:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "280px", overflowY: "auto" }}>
                  {rates.map((rate) => (
                    <label
                      key={rate.object_id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer",
                        border: `1px solid ${selectedRateId === rate.object_id ? "var(--gold)" : "rgba(201,168,76,0.15)"}`,
                        background: selectedRateId === rate.object_id ? "var(--gold-muted)" : "var(--elevated)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input
                          type="radio"
                          name="rate"
                          value={rate.object_id}
                          checked={selectedRateId === rate.object_id}
                          onChange={() => setSelectedRateId(rate.object_id)}
                          style={{ accentColor: "var(--gold)" }}
                        />
                        <div>
                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                            {rate.provider} — {rate.servicelevel.name}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>
                            {rate.estimated_days ? `Est. ${rate.estimated_days} day${rate.estimated_days !== 1 ? "s" : ""}` : "Estimated days vary"}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.95rem" }}>
                        ${parseFloat(rate.amount).toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => setShippoStep("parcel")} className="btn-gold-outline" style={{ flex: 1 }}>← Back</button>
                  <button
                    onClick={buyLabel}
                    disabled={!selectedRateId}
                    className="btn-gold"
                    style={{ flex: 2, justifyContent: "center" }}
                  >
                    <Package size={14} />
                    Buy Label — ${selectedRateId ? parseFloat(rates.find(r => r.object_id === selectedRateId)?.amount || "0").toFixed(2) : "—"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Buying (spinner) */}
            {shippoStep === "buying" && (
              <div style={{ textAlign: "center", padding: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <Loader2 size={40} style={{ color: "var(--gold)", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>Purchasing label from Shippo...</p>
              </div>
            )}

            {/* STEP 4: Done */}
            {shippoStep === "done" && labelResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto" }} />
                  <p style={{ color: "var(--text)", fontWeight: 600, marginTop: "0.75rem" }}>Label purchased successfully!</p>
                </div>
                <div style={{ background: "var(--elevated)", borderRadius: "8px", padding: "1rem" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 0.35rem" }}>Tracking Number</p>
                  <p style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "#3b82f6", margin: 0, fontWeight: 700 }}>{labelResult.tracking_number}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <a
                    href={labelResult.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold-outline"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", textDecoration: "none" }}
                  >
                    <Truck size={14} /> Track
                  </a>
                  <a
                    href={labelResult.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold"
                    style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", textDecoration: "none" }}
                  >
                    <Printer size={14} /> Print Label (PDF)
                  </a>
                </div>
                <button onClick={closeShippoModal} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrderId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setTrackingOrderId(null); }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "440px", animation: "zoomIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Truck size={18} style={{ color: "var(--gold)" }} /> Add Tracking
              </h2>
              <button onClick={() => setTrackingOrderId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Tracking Number *
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="input-dark"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Tracking URL (optional)
                </label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.ups.com/track?tracknum=..."
                  className="input-dark"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
                This will mark the order as <strong>shipped</strong> and the customer will see the tracking number in their order details.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setTrackingOrderId(null)} className="btn-gold-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={saveTracking} disabled={!trackingNumber.trim() || trackingLoading} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                  {trackingLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><Truck size={14} /> Save Tracking</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
