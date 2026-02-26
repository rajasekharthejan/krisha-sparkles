"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getGuestWishlist, toggleGuestWishlist } from "@/lib/wishlistUtils";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { addItem, openCart } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      const supabase = createClient();

      if (user) {
        // Logged-in: fetch from DB
        const { data } = await supabase
          .from("wishlists")
          .select("product_id, products(*, category:categories(id,name,slug))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const prods = (data || [])
          .map((item: { product_id: string; products: unknown }) => item.products)
          .filter(Boolean) as Product[];
        setProducts(prods);
      } else {
        // Guest: fetch from localStorage
        const ids = getGuestWishlist();
        if (ids.length > 0) {
          const { data } = await supabase
            .from("products")
            .select("*, category:categories(id,name,slug)")
            .in("id", ids)
            .eq("active", true);
          setProducts((data as Product[]) || []);
        } else {
          setProducts([]);
        }
      }
      setLoading(false);
    }
    loadWishlist();
  }, [user]);

  async function removeFromWishlist(productId: string) {
    if (user) {
      const supabase = createClient();
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
    } else {
      toggleGuestWishlist(productId);
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  function handleAddToCart(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      slug: product.slug,
    });
    openCart();
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--muted)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "2rem" }}>
          <ArrowLeft size={15} /> Back to Account
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <Heart size={24} style={{ color: "var(--gold)" }} />
          <div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>My Wishlist</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              {loading ? "Loading..." : `${products.length} saved item${products.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {!user && (
          <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid var(--gold-border)", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--muted)" }}>
            💡 You&apos;re browsing as a guest. <Link href="/auth/login" style={{ color: "var(--gold)", textDecoration: "none" }}>Sign in</Link> to save your wishlist permanently.
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer-box" style={{ height: "320px", borderRadius: "12px" }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🤍</div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Your wishlist is empty</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>Save items you love by clicking the heart icon on any product.</p>
            <Link href="/shop" className="btn-gold">Browse Collection</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {products.map((product) => {
              const hasDiscount = product.compare_price && product.compare_price > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gold-border)")}
                >
                  {/* Image */}
                  <Link href={`/shop/${product.slug}`} style={{ display: "block", position: "relative", aspectRatio: "1", overflow: "hidden", background: "var(--elevated)" }}>
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>💎</div>
                    )}
                    {hasDiscount && (
                      <span style={{ position: "absolute", top: "10px", left: "10px", padding: "0.15rem 0.5rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 700 }}>
                        -{discountPct}%
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>
                      {product.category?.name || "Jewelry"}
                    </p>
                    <Link href={`/shop/${product.slug}`} style={{ textDecoration: "none" }}>
                      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.name}
                      </h3>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "1rem" }}>{formatPrice(product.price)}</span>
                      {hasDiscount && (
                        <span style={{ fontSize: "0.8rem", color: "var(--subtle)", textDecoration: "line-through" }}>{formatPrice(product.compare_price!)}</span>
                      )}
                    </div>
                    {product.stock_quantity === 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#ef4444", margin: 0 }}>Out of Stock</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--gold-border)", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="btn-gold"
                      style={{ flex: 1, justifyContent: "center", padding: "0.5rem", fontSize: "0.78rem", gap: "0.35rem", opacity: product.stock_quantity === 0 ? 0.5 : 1 }}
                    >
                      <ShoppingBag size={13} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      style={{
                        width: "36px", height: "36px", borderRadius: "6px",
                        border: "1px solid rgba(239,68,68,0.3)",
                        background: "rgba(239,68,68,0.06)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#ef4444", transition: "all 0.2s", flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
