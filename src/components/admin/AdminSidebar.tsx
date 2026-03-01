"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  LogOut, ExternalLink, Upload, TrendingUp, Tag, Star,
  RotateCcw, Mail, MessageCircle, Instagram, Layout,
  BookOpen, Gift, BarChart3, Boxes, Music2, Users, RefreshCw,
} from "lucide-react";

const GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin",           label: "Dashboard",  icon: <LayoutDashboard size={16} /> },
      { href: "/admin/analytics", label: "Analytics",  icon: <BarChart3 size={16} /> },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products",             label: "Products",     icon: <Package size={16} /> },
      { href: "/admin/products/bulk-upload", label: "Bulk Upload",  icon: <Upload size={16} /> },
      { href: "/admin/products/bulk-price",  label: "Bulk Pricing", icon: <TrendingUp size={16} /> },
      { href: "/admin/inventory",            label: "Inventory",    icon: <Warehouse size={16} /> },
      { href: "/admin/bundles",              label: "Bundles",      icon: <Boxes size={16} /> },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders",  label: "Orders",  icon: <ShoppingCart size={16} /> },
      { href: "/admin/users",   label: "Users",   icon: <Users size={16} /> },
      { href: "/admin/refunds", label: "Refunds", icon: <RotateCcw size={16} /> },
      { href: "/admin/reviews", label: "Reviews", icon: <Star size={16} /> },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/promotions",  label: "Promotions",     icon: <Tag size={16} /> },
      { href: "/admin/newsletter",  label: "Email Marketing", icon: <Mail size={16} /> },
      { href: "/admin/emails",      label: "Email Log",      icon: <Mail size={16} /> },
      { href: "/admin/affiliates",  label: "Affiliates",     icon: <TrendingUp size={16} /> },
      { href: "/admin/referrals",   label: "Referrals",      icon: <Gift size={16} /> },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog",        label: "Blog",        icon: <BookOpen size={16} /> },
      { href: "/admin/collections", label: "Collections", icon: <Layout size={16} /> },
      { href: "/admin/instagram",   label: "Instagram",   icon: <Instagram size={16} /> },
      { href: "/admin/tiktok",      label: "TikTok",      icon: <Music2 size={16} /> },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/admin/messages", label: "Messages", icon: <MessageCircle size={16} /> },
    ],
  },
];

function NavLink({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.5rem 0.75rem", borderRadius: "7px",
        textDecoration: "none",
        color: isActive ? "var(--gold)" : "var(--muted)",
        background: isActive ? "var(--gold-muted)" : "transparent",
        border: `1px solid ${isActive ? "var(--gold-border)" : "transparent"}`,
        fontSize: "0.82rem", fontWeight: isActive ? 600 : 400,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; } }}
    >
      {icon}{label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <aside style={{ width: "240px", minHeight: "100vh", background: "var(--surface)", borderRight: "1px solid var(--gold-border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid var(--gold-border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(201,168,76,0.3)" }}>
          <Image src="/logo.png" alt="Krisha Sparkles" width={36} height={36} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
        <div>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: "0.95rem", fontWeight: 700, background: "linear-gradient(135deg, #c9a84c, #e8c96a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>
            Krisha Sparkles
          </span>
          <p style={{ fontSize: "0.55rem", color: "var(--subtle)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Admin Portal</p>
        </div>
      </div>

      {/* Grouped Nav */}
      <nav style={{ flex: 1, padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0", overflowY: "auto" }}>
        {GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "0.25rem" }}>
            {/* Group label */}
            <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,168,76,0.45)", padding: "0.6rem 0.75rem 0.3rem", margin: 0 }}>
              {group.label}
            </p>
            {/* Group items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — always visible */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--gold-border)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>

        {/* Reset Data — pinned, red */}
        <Link
          href="/admin/reset"
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.5rem 0.75rem", borderRadius: "7px",
            textDecoration: "none", fontSize: "0.82rem", fontWeight: 600,
            color: pathname.startsWith("/admin/reset") ? "#ef4444" : "rgba(239,68,68,0.6)",
            background: pathname.startsWith("/admin/reset") ? "rgba(239,68,68,0.08)" : "transparent",
            border: `1px solid ${pathname.startsWith("/admin/reset") ? "rgba(239,68,68,0.3)" : "transparent"}`,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => {
            if (!pathname.startsWith("/admin/reset")) {
              e.currentTarget.style.color = "rgba(239,68,68,0.6)";
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <RefreshCw size={15} /> Reset Data
        </Link>

        {/* View Store */}
        <Link href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", borderRadius: "7px", textDecoration: "none", color: "var(--muted)", fontSize: "0.8rem", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <ExternalLink size={15} /> View Store
        </Link>

        {/* Sign Out */}
        <button onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem", width: "100%", textAlign: "left", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "none"; }}
        >
          <LogOut size={15} /> Sign Out
        </button>

        {/* Version */}
        <p style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "0.4rem 0 0", letterSpacing: "0.05em" }}>
          v7.14 · Krisha Sparkles Admin
        </p>
      </div>
    </aside>
  );
}
