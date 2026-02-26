"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingCart, ChevronDown, Truck, X, Loader2 } from "lucide-react";
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    // Use the admin API endpoint (service role) so we see ALL orders, bypassing RLS
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/orders/list${params}`);
    const json = await res.json();
    setOrders((json.orders as Order[]) || []);
    setLoading(false);
  }, [filter]);

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

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>Orders</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{orders.length} orders</p>
        </div>
        {/* Filter */}
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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = statusStyle(order.status);
                  const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
                  return (
                    <tr key={order.id}>
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
                      <td>
                        {order.tracking_number ? (
                          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#3b82f6" }}>{order.tracking_number}</span>
                        ) : (
                          <button
                            onClick={() => { setTrackingOrderId(order.id); setTrackingNumber(""); setTrackingUrl(""); }}
                            style={{
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.35rem 0.65rem", borderRadius: "6px",
                              background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)",
                              color: "#3b82f6", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.08)")}
                          >
                            <Truck size={11} /> Add Tracking
                          </button>
                        )}
                      </td>
                      <td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
