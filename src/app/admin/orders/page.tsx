"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingCart, ChevronDown } from "lucide-react";
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o
      )
    );
    setUpdatingId(null);
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
    </div>
  );
}
