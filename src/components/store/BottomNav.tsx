"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, ShoppingBag, Heart, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCartStore();
  const { user } = useAuthStore();
  const count = totalItems();

  function active(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  function iconColor(href: string) {
    return active(href) ? "var(--gold)" : "var(--muted)";
  }

  function labelStyle(href: string): React.CSSProperties {
    return {
      fontSize: "0.57rem",
      color: active(href) ? "var(--gold)" : "var(--muted)",
      fontWeight: active(href) ? 700 : 400,
      letterSpacing: "0.05em",
      lineHeight: 1,
      transition: "color 0.2s",
      textTransform: "uppercase",
    };
  }

  return (
    <>
      <style>{`
        .ks-bottom-nav { display: flex; }
        @media (min-width: 768px) { .ks-bottom-nav { display: none !important; } }
        .ks-bnav-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 5px; padding: 8px 2px;
          background: none; border: none; cursor: pointer; text-decoration: none;
          position: relative; -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease, opacity 0.15s;
          min-width: 0;
        }
        .ks-bnav-item:active { transform: scale(0.88); opacity: 0.7; }
        .ks-bnav-dot {
          position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
          width: 3px; height: 3px; border-radius: 50%; background: var(--gold);
        }
      `}</style>
      <nav
        className="ks-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 45,
          background: "rgba(8,8,8,0.97)",
          borderTop: "1px solid rgba(201,168,76,0.2)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: "calc(60px + env(safe-area-inset-bottom, 0px))",
          alignItems: "center",
          justifyContent: "space-around",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Home */}
        <Link href="/" className="ks-bnav-item">
          <Home size={22} color={iconColor("/")} strokeWidth={active("/") ? 2.5 : 1.75} />
          <span style={labelStyle("/")}>Home</span>
          {active("/") && <span className="ks-bnav-dot" />}
        </Link>

        {/* Shop */}
        <Link href="/shop" className="ks-bnav-item">
          <Grid3X3 size={21} color={iconColor("/shop")} strokeWidth={active("/shop") ? 2.5 : 1.75} />
          <span style={labelStyle("/shop")}>Shop</span>
          {active("/shop") && <span className="ks-bnav-dot" />}
        </Link>

        {/* Cart — centre focal button */}
        <button className="ks-bnav-item" onClick={openCart} style={{ flex: 1 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold), #e8c96a, var(--gold))",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(201,168,76,0.45)",
                transform: "translateY(-6px)",
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={20} color="#0a0a0a" strokeWidth={2.25} />
            </div>
            {count > 0 && (
              <span style={{
                position: "absolute", top: "-2px", right: "-6px",
                background: "#ef4444", color: "#fff",
                borderRadius: "50%", fontSize: "0.55rem", fontWeight: 700,
                width: "17px", height: "17px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #0a0a0a",
                animation: "scaleIn 0.2s ease",
              }}>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </div>
          <span style={{ ...labelStyle("/cart"), marginTop: "-6px" }}>Cart</span>
        </button>

        {/* Wishlist */}
        <Link href="/account/wishlist" className="ks-bnav-item">
          <Heart
            size={22}
            color={iconColor("/account/wishlist")}
            fill={active("/account/wishlist") ? "var(--gold)" : "none"}
            strokeWidth={active("/account/wishlist") ? 2.5 : 1.75}
          />
          <span style={labelStyle("/account/wishlist")}>Saved</span>
          {active("/account/wishlist") && <span className="ks-bnav-dot" />}
        </Link>

        {/* Account */}
        <Link href={user ? "/account" : "/auth/login"} className="ks-bnav-item">
          <User size={22} color={iconColor("/account")} strokeWidth={active("/account") ? 2.5 : 1.75} />
          <span style={labelStyle("/account")}>Account</span>
          {active("/account") && <span className="ks-bnav-dot" />}
        </Link>
      </nav>
    </>
  );
}
