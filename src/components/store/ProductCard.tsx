"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Heart, Check } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  const mainImage = product.images?.[0] || "";
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      slug: product.slug,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  function handleWish(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWished((w) => !w);
  }

  return (
    <div
      className="product-card"
      style={{
        animation: "scaleIn 0.45s ease both",
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <Link href={`/shop/${product.slug}`} style={{ textDecoration: "none", display: "block" }}>
        {/* Image */}
        <div className="card-image">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3.5rem",
                background: "linear-gradient(135deg, var(--elevated), var(--surface))",
              }}
            >
              💎
            </div>
          )}

          {/* Badges */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            {product.featured && (
              <span
                className="badge-gold"
                style={{ fontSize: "0.6rem", padding: "0.15rem 0.55rem" }}
              >
                ★ Featured
              </span>
            )}
            {hasDiscount && (
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  borderRadius: "9999px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                }}
              >
                -{discountPct}%
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  background: "rgba(80,80,80,0.9)",
                  color: "#ddd",
                  borderRadius: "9999px",
                  fontSize: "0.62rem",
                  fontWeight: 600,
                }}
              >
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWish}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: wished
                ? "rgba(239,68,68,0.15)"
                : "rgba(10,10,10,0.65)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${wished ? "rgba(239,68,68,0.5)" : "rgba(201,168,76,0.3)"}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              animation: wished ? "heartPop 0.4s ease" : "none",
            }}
          >
            <Heart
              size={14}
              style={{
                color: wished ? "#ef4444" : "var(--muted)",
                fill: wished ? "#ef4444" : "none",
                transition: "all 0.2s ease",
              }}
            />
          </button>

          {/* Add to Cart Overlay */}
          {product.stock_quantity > 0 && (
            <div className="add-to-cart-overlay">
              <button
                onClick={handleAddToCart}
                className="btn-gold"
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  fontSize: "0.75rem",
                  gap: "0.4rem",
                  justifyContent: "center",
                  transition: "all 0.25s ease",
                  background: added
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : undefined,
                }}
              >
                {added ? <Check size={14} /> : <ShoppingBag size={14} />}
                {added ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "0.9rem 0.875rem 1rem" }}>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--gold)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "3px",
              fontWeight: 600,
              opacity: 0.8,
            }}
          >
            {product.category?.name || "Jewelry"}
          </p>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "0.5rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {product.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--gold)",
                letterSpacing: "-0.01em",
              }}
            >
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--subtle)",
                  textDecoration: "line-through",
                }}
              >
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <p
              style={{
                fontSize: "0.68rem",
                color: "#f59e0b",
                marginTop: "5px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🔥 Only {product.stock_quantity} left!
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
