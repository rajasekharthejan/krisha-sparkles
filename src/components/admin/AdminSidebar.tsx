"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  LogOut,
  ExternalLink,
  Upload,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/products", label: "Products", icon: <Package size={18} /> },
  { href: "/admin/products/bulk-upload", label: "Bulk Upload", icon: <Upload size={18} /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingCart size={18} /> },
  { href: "/admin/inventory", label: "Inventory", icon: <Warehouse size={18} /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--gold-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--gold-border)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            overflow: "hidden",
            flexShrink: 0,
            border: "1px solid rgba(201,168,76,0.3)",
            boxShadow: "0 2px 8px rgba(201,168,76,0.2)",
          }}
        >
          <Image
            src="/logo.png"
            alt="Krisha Sparkles"
            width={38}
            height={38}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
        <div>
          <span
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              display: "block",
            }}
          >
            Krisha Sparkles
          </span>
          <p style={{ fontSize: "0.6rem", color: "var(--subtle)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Admin Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {NAV.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.75rem",
                borderRadius: "8px",
                textDecoration: "none",
                color: isActive ? "var(--gold)" : "var(--muted)",
                background: isActive ? "var(--gold-muted)" : "transparent",
                border: `1px solid ${isActive ? "var(--gold-border)" : "transparent"}`,
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid var(--gold-border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Link
          href="/"
          target="_blank"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.65rem 0.75rem",
            borderRadius: "8px",
            textDecoration: "none",
            color: "var(--muted)",
            fontSize: "0.8rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <ExternalLink size={16} />
          View Store
        </Link>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.65rem 0.75rem",
            borderRadius: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "0.8rem",
            width: "100%",
            textAlign: "left",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "none";
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
