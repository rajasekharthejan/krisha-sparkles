"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Check, Share2, Truck, RefreshCw, Shield } from "lucide-react";
import type { Product } from "@/types";
import ProductCard from "@/components/store/ProductCard";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    async function fetchProduct() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .eq("slug", slug)
        .eq("active", true)
        .single();

      if (data) {
        setProduct(data as Product);
        // Fetch related
        const { data: rel } = await supabase
          .from("products")
          .select("*, category:categories(id,name,slug)")
          .eq("category_id", data.category_id)
          .eq("active", true)
          .neq("id", data.id)
          .limit(4);
        setRelated((rel as Product[]) || []);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      slug: product.slug,
      quantity,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
            <div className="shimmer-box" style={{ aspectRatio: "1", borderRadius: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-box" style={{ height: i === 0 ? "40px" : "20px", borderRadius: "8px", width: i === 2 ? "40%" : "100%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "4rem" }}>💎</p>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", margin: "1rem 0" }}>Product Not Found</h2>
          <Link href="/shop" className="btn-gold">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [""];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: "var(--muted)", textDecoration: "none" }}>Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${product.category.slug}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: "var(--gold)" }}>{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", alignItems: "start" }}>
          {/* Images */}
          <div>
            {/* Main Image */}
            <div
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "16px",
                overflow: "hidden",
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                marginBottom: "1rem",
              }}
            >
              {images[activeImage] ? (
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>
                  💎
                </div>
              )}

              {/* Nav Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                    style={{
                      position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)",
                      border: "1px solid var(--gold-border)", cursor: "pointer",
                      color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImage((activeImage + 1) % images.length)}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)",
                      border: "1px solid var(--gold-border)", cursor: "pointer",
                      color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden",
                      border: `2px solid ${activeImage === i ? "var(--gold)" : "rgba(201,168,76,0.15)"}`,
                      cursor: "pointer", padding: 0, background: "var(--surface)",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {img && <Image src={img} alt="" width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Category & badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {product.category && (
                <Link href={`/shop?category=${product.category.slug}`} className="badge-gold" style={{ textDecoration: "none" }}>
                  {product.category.name}
                </Link>
              )}
              {product.featured && (
                <span className="badge-gold">Featured</span>
              )}
              {hasDiscount && (
                <span style={{ padding: "0.2rem 0.75rem", background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {discountPct}% Off
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", fontWeight: 700, color: "var(--gold)" }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: "1.1rem", color: "var(--subtle)", textDecoration: "line-through" }}>
                  {formatPrice(product.compare_price!)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div>
              {product.stock_quantity > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.875rem" }}>
                  <Check size={16} />
                  {product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left in stock` : "In Stock"}
                </div>
              ) : (
                <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>Out of Stock</p>
              )}
            </div>

            {/* Quantity */}
            {product.stock_quantity > 0 && (
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Quantity
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: "40px", height: "40px", border: "1px solid var(--gold-border)", borderRight: "none",
                      borderRadius: "4px 0 0 4px", background: "var(--elevated)", color: "var(--gold)",
                      cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    width: "50px", height: "40px", border: "1px solid var(--gold-border)",
                    background: "var(--elevated)", color: "var(--text)", fontSize: "0.875rem",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600,
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    style={{
                      width: "40px", height: "40px", border: "1px solid var(--gold-border)", borderLeft: "none",
                      borderRadius: "0 4px 4px 0", background: "var(--elevated)", color: "var(--gold)",
                      cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="btn-gold"
                style={{ flex: 1, justifyContent: "center", minWidth: "160px" }}
              >
                <ShoppingBag size={16} />
                {added ? "Added to Cart!" : "Add to Cart"}
              </button>
              <button
                onClick={() => setWished(!wished)}
                style={{
                  width: "48px", height: "48px", border: "1px solid var(--gold-border)",
                  borderRadius: "4px", background: wished ? "var(--gold-muted)" : "var(--elevated)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: wished ? "#ef4444" : "var(--muted)", transition: "all 0.2s",
                }}
              >
                <Heart size={18} style={{ fill: wished ? "#ef4444" : "none" }} />
              </button>
              <button
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
                style={{
                  width: "48px", height: "48px", border: "1px solid var(--gold-border)",
                  borderRadius: "4px", background: "var(--elevated)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", transition: "all 0.2s",
                }}
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Trust Badges */}
            <div
              style={{
                display: "flex", flexDirection: "column", gap: "0.75rem",
                padding: "1.25rem", background: "var(--surface)",
                border: "1px solid var(--gold-border)", borderRadius: "10px",
              }}
            >
              {[
                { icon: <Truck size={15} />, text: "Free shipping on orders over $75" },
                { icon: <RefreshCw size={15} />, text: "7-day easy return policy" },
                { icon: <Shield size={15} />, text: "Secure payment via Stripe" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ color: "var(--gold)" }}>{item.icon}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: "5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>
                You May Also Like
              </h2>
              <div className="gold-divider" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
