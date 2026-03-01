"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  Trash2,
  Shield,
  Search,
  RefreshCw,
  ShoppingBag,
  Star,
  X,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_sign_in: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  points_balance: number;
  order_count: number;
  total_spent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setUsers(json.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function deleteUser(user: AdminUser) {
    setDeletingId(user.id);
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`User ${user.email} deleted`);
    } else {
      showToast(json.error || "Delete failed", false);
    }
    setDeletingId(null);
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)
    );
  });

  const totalSpent = users.filter((u) => !u.is_admin).reduce((s, u) => s + u.total_spent, 0);
  const totalOrders = users.filter((u) => !u.is_admin).reduce((s, u) => s + u.order_count, 0);

  function formatDate(d: string | null) {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={24} style={{ color: "var(--gold)" }} /> Users
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {users.length} total · {users.filter((u) => !u.is_admin).length} customers
          </p>
        </div>
        <button
          onClick={fetchUsers}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", borderRadius: "8px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "var(--gold)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Users", value: users.filter((u) => !u.is_admin).length, icon: <Users size={18} />, color: "#c9a84c" },
          { label: "Total Orders", value: totalOrders, icon: <ShoppingBag size={18} />, color: "#10b981" },
          { label: "Total Revenue", value: formatPrice(totalSpent), icon: <Star size={18} />, color: "#8b5cf6", isPrice: true },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: s.color }}>{s.icon}</div>
            <p style={{ fontSize: "1.4rem", fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.5rem", maxWidth: "400px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: "100%", padding: "0.65rem 1rem 0.65rem 2.5rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "8px", color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p>Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>
            <Users size={48} style={{ opacity: 0.3, margin: "0 auto 1rem" }} strokeWidth={1} />
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Points</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "50%",
                          background: user.is_admin ? "linear-gradient(135deg,#c9a84c,#e8c96a)" : "rgba(201,168,76,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700,
                          color: user.is_admin ? "#0a0a0a" : "var(--gold)",
                          flexShrink: 0,
                        }}>
                          {(user.first_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            {user.first_name || user.last_name
                              ? `${user.first_name} ${user.last_name}`.trim()
                              : <span style={{ color: "var(--muted)" }}>—</span>}
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {user.phone ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Phone size={11} /> {user.phone}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(user.created_at)}</td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{formatDate(user.last_sign_in)}</td>
                    <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.order_count}</td>
                    <td style={{ color: "var(--gold)", fontWeight: 700 }}>{formatPrice(user.total_spent)}</td>
                    <td>
                      {user.points_balance > 0 ? (
                        <span style={{ fontSize: "0.8rem", color: "#8b5cf6", fontWeight: 600 }}>
                          ✦ {user.points_balance} pts
                        </span>
                      ) : <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>0</span>}
                    </td>
                    <td>
                      {user.is_admin ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, color: "#c9a84c", background: "rgba(201,168,76,0.12)", padding: "0.25rem 0.6rem", borderRadius: "99px", border: "1px solid rgba(201,168,76,0.3)" }}>
                          <Shield size={11} /> Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", background: "rgba(255,255,255,0.05)", padding: "0.25rem 0.6rem", borderRadius: "99px" }}>
                          Customer
                        </span>
                      )}
                    </td>
                    <td>
                      {!user.is_admin && (
                        <button
                          onClick={() => setConfirmDelete(user)}
                          disabled={deletingId === user.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.35rem 0.65rem", borderRadius: "6px",
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                            color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                        >
                          {deletingId === user.id
                            ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                            : <Trash2 size={11} />}
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div style={{ background: "var(--surface)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", fontWeight: 700, color: "#ef4444", margin: 0 }}>
                Delete User?
              </h2>
              <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              This will permanently delete:
            </p>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{confirmDelete.email}</p>
              {(confirmDelete.first_name || confirmDelete.last_name) && (
                <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                  {confirmDelete.first_name} {confirmDelete.last_name}
                </p>
              )}
              <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.5rem" }}>
                ⚠ {confirmDelete.order_count} orders · {formatPrice(confirmDelete.total_spent)} spent · {confirmDelete.points_balance} points — all will be removed
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setConfirmDelete(null)} className="btn-gold-outline" style={{ flex: 1 }}>Cancel</button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: "#ef4444", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}
              >
                <Trash2 size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 200,
          background: toast.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
          color: toast.ok ? "#10b981" : "#ef4444",
          padding: "0.75rem 1.25rem", borderRadius: "10px",
          fontSize: "0.875rem", fontWeight: 600,
          backdropFilter: "blur(8px)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
