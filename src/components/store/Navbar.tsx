"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, Search, Instagram, User, LogOut, Package, UserCircle, Heart, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import CartDrawer from "./CartDrawer";
import SearchOverlay from "./SearchOverlay";
import { createBrowserClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NAV_LINKS = [
  { label: "Home",      href: "/" },
  { label: "Shop",      href: "/shop" },
  { label: "Jewelry",   href: "/shop?category=necklaces" },
  { label: "Earrings",  href: "/shop?category=earrings" },
  { label: "Jadau",     href: "/shop?category=jadau-jewelry" },
  { label: "Dresses",   href: "/shop?category=dresses" },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const { totalItems, toggleCart }    = useCartStore();
  const { user, setUser, setLoading } = useAuthStore();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const itemCount = totalItems();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Bootstrap auth state from Supabase
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data }) => {
      setUser((data.session?.user ?? null) as SupabaseUser | null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user ?? null) as SupabaseUser | null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Fetch loyalty points balance when user logs in
  useEffect(() => {
    if (!user) { setPointsBalance(null); return; }
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from("user_profiles")
      .select("points_balance")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setPointsBalance(data.points_balance ?? 0);
      });
  }, [user]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const userInitial = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      <style>{`
        .nav-desktop { display: none; }
        .nav-mobile-btn { display: flex; }
        .nav-ig-icon { display: none; }
        @media (min-width: 768px) {
          .nav-desktop { display: flex; }
          .nav-mobile-btn { display: none; }
          .nav-ig-icon { display: flex; }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 40,
          transition: "all 0.4s ease",
          background: scrolled ? "rgba(10,10,10,0.96)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(201,168,76,0.15)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.55rem", flexShrink: 0 }}>
              <div
                style={{
                  width: "40px", height: "40px",
                  borderRadius: "10px", overflow: "hidden", flexShrink: 0,
                  boxShadow: "0 2px 12px rgba(201,168,76,0.25)",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Krisha Sparkles"
                  width={40} height={40}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  priority
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "1.05rem", fontWeight: 700,
                    background: "linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Krisha
                </span>
                <span style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase", marginTop: "1px" }}>
                  Sparkles
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="nav-desktop" style={{ gap: "1.75rem", alignItems: "center" }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: "none", color: "var(--muted)",
                    fontSize: "0.78rem", letterSpacing: "0.08em",
                    textTransform: "uppercase", fontWeight: 500,
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Instagram — desktop only */}
              <a
                href="https://www.instagram.com/krisha_sparkles/"
                target="_blank" rel="noopener noreferrer"
                className="nav-ig-icon"
                style={{ color: "var(--muted)", transition: "color 0.2s ease", alignItems: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                <Instagram size={18} />
              </a>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", transition: "color 0.2s ease", display: "flex", alignItems: "center", padding: "4px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* User Account */}
              <div ref={userMenuRef} style={{ position: "relative" }}>
                {user ? (
                  /* Logged in — avatar button */
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      width: "32px", height: "32px",
                      borderRadius: "50%",
                      background: "var(--gold-muted)",
                      border: "1.5px solid var(--gold)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--gold)",
                      fontSize: "0.75rem", fontWeight: 700,
                      transition: "background 0.2s",
                    }}
                    aria-label="Account menu"
                  >
                    {userInitial}
                  </button>
                ) : (
                  /* Guest — login link */
                  <Link
                    href="/auth/login"
                    style={{ color: "var(--muted)", transition: "color 0.2s ease", display: "flex", alignItems: "center" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                    aria-label="Sign in"
                  >
                    <User size={18} />
                  </Link>
                )}

                {/* Dropdown */}
                {userMenuOpen && user && (
                  <div
                    style={{
                      position: "absolute", right: 0, top: "calc(100% + 10px)",
                      background: "rgba(17,17,17,0.98)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      borderRadius: "12px",
                      padding: "0.5rem",
                      minWidth: "200px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                      backdropFilter: "blur(16px)",
                      zIndex: 50,
                      animation: "scaleIn 0.15s ease",
                    }}
                  >
                    {/* Email header */}
                    <div style={{ padding: "0.6rem 0.75rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "0.25rem" }}>
                      <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </p>
                      {pointsBalance !== null && (
                        <p style={{ fontSize: "0.68rem", color: "var(--gold)", margin: "3px 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                          <Star size={10} fill="currentColor" /> {pointsBalance} pts
                        </p>
                      )}
                    </div>
                    {[
                      { href: "/account", icon: <UserCircle size={15} />, label: "My Account" },
                      { href: "/account/orders", icon: <Package size={15} />, label: "My Orders" },
                      { href: "/account/wishlist", icon: <Heart size={15} />, label: "My Wishlist" },
                      { href: "/account/points", icon: <Star size={15} />, label: `${pointsBalance ?? 0} Points` },
                      { href: "/account/profile", icon: <User size={15} />, label: "Edit Profile" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.65rem",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "var(--muted)",
                          fontSize: "0.875rem",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.25rem", paddingTop: "0.25rem" }}>
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.65rem",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          background: "none", border: "none",
                          cursor: "pointer",
                          color: "var(--muted)",
                          fontSize: "0.875rem",
                          width: "100%",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={toggleCart}
                style={{
                  position: "relative", background: "none", border: "none",
                  cursor: "pointer", color: "var(--text)", padding: "4px",
                  display: "flex", alignItems: "center", transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
                aria-label="Open cart"
              >
                <ShoppingBag size={22} />
                {itemCount > 0 && (
                  <span
                    style={{
                      position: "absolute", top: "-4px", right: "-4px",
                      width: "18px", height: "18px",
                      background: "var(--gold)", color: "#0a0a0a",
                      borderRadius: "50%", fontSize: "0.65rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: "scaleIn 0.2s ease",
                    }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger */}
              <button
                className="nav-mobile-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text)", padding: "4px", alignItems: "center",
                }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            style={{
              background: "rgba(10,10,10,0.98)",
              borderTop: "1px solid var(--gold-border)",
              padding: "1rem 1.25rem 1.5rem",
              animation: "slideUp 0.25s ease",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  textDecoration: "none", color: "var(--muted)",
                  fontSize: "1rem", letterSpacing: "0.06em",
                  textTransform: "uppercase", fontWeight: 500,
                  padding: "0.875rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  transition: "color 0.2s ease",
                }}
              >
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
                {link.label}
              </Link>
            ))}
            {/* Auth links in mobile */}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--muted)", fontSize: "0.9rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <UserCircle size={16} style={{ color: "var(--gold)" }} /> My Account
                  </Link>
                  <Link href="/account/orders" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--muted)", fontSize: "0.9rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Package size={16} style={{ color: "var(--gold)" }} /> My Orders
                  </Link>
                  <Link href="/account/wishlist" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--muted)", fontSize: "0.9rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Heart size={16} style={{ color: "var(--gold)" }} /> My Wishlist
                  </Link>
                  <button onClick={() => { setMobileOpen(false); handleSignOut(); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.9rem", padding: "0.75rem 0", width: "100%" }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--gold)", fontSize: "0.9rem", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <User size={16} /> Sign In
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--muted)", fontSize: "0.9rem", padding: "0.75rem 0" }}>
                    <UserCircle size={16} /> Create Account
                  </Link>
                </>
              )}
            </div>
            <a
              href="https://www.instagram.com/krisha_sparkles/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                marginTop: "1.25rem", color: "var(--gold)",
                textDecoration: "none", fontSize: "0.875rem",
              }}
            >
              <Instagram size={16} />
              Follow 
            </a>
          </div>
        )}
      </nav>

      <CartDrawer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
