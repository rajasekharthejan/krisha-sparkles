"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();

  const images = product.images?.length ? product.images : [];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAddToCart = useCallback(() => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || "",
      slug: product.slug,
    });
    setAdded(true);
    openCart();
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  }, [addItem, product, images, openCart, onClose]);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--elevated)",
          borderRadius: "16px",
          border: "1px solid var(--gold-border)",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          animation: "scaleIn 0.3s ease",
        }}
      >
        {/* Left — Image Gallery */}
        <div
          style={{
            position: "relative",
            aspectRatio: "1",
            background: "var(--surface)",
            borderRadius: "16px 0 0 16px",
            overflow: "hidden",
          }}
        >
          {images.length > 0 ? (
            <Image
              src={images[currentImage]}
              alt={product.name}
              fill
              sizes="400px"
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
                fontSize: "5rem",
                background: "linear-gradient(135deg, var(--elevated), var(--surface))",
              }}
            >
              💎
            </div>
          )}

          {/* Image nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Image dots */}
          {images.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "6px",
              }}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: i === currentImage ? "var(--gold)" : "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {product.featured && (
              <span className="badge-gold" style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem" }}>
                ★ Featured
              </span>
            )}
            {hasDiscount && (
              <span style={{ padding: "0.2rem 0.6rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700 }}>
                -{discountPct}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right — Product Info */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              alignSelf: "flex-end",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            <X size={16} />
          </button>

          {/* Category */}
          <p style={{ fontSize: "0.72rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, margin: 0 }}>
            {product.category?.name || "Jewelry"}
          </p>

          {/* Name */}
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>
            {product.name}
          </h2>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: "1rem", color: "var(--subtle)", textDecoration: "line-through" }}>
                {formatPrice(product.compare_price!)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0, maxHeight: "120px", overflow: "hidden" }}>
              {product.description}
            </p>
          )}

          {/* Metadata pills */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {product.material && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--surface)", border: "1px solid var(--gold-border)", fontSize: "0.7rem", color: "var(--muted)" }}>
                {product.material}
              </span>
            )}
            {product.occasion && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--surface)", border: "1px solid var(--gold-border)", fontSize: "0.7rem", color: "var(--muted)" }}>
                {product.occasion}
              </span>
            )}
            {product.style && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", background: "var(--surface)", border: "1px solid var(--gold-border)", fontSize: "0.7rem", color: "var(--muted)" }}>
                {product.style}
              </span>
            )}
          </div>

          {/* Stock info */}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600, margin: 0 }}>
              🔥 Only {product.stock_quantity} left in stock!
            </p>
          )}
          {product.stock_quantity === 0 && (
            <p style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 600, margin: 0 }}>
              Currently sold out
            </p>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Add to Cart */}
          {product.stock_quantity > 0 && (
            <button
              onClick={handleAddToCart}
              className="btn-gold"
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "0.9rem",
                justifyContent: "center",
                gap: "0.5rem",
                background: added ? "linear-gradient(135deg, #10b981, #059669)" : undefined,
              }}
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              {added ? "Added to Cart!" : "Add to Cart"}
            </button>
          )}

          {/* View Full Details */}
          <Link
            href={`/shop/${product.slug}`}
            onClick={onClose}
            style={{
              display: "block",
              textAlign: "center",
              color: "var(--gold)",
              fontSize: "0.85rem",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            View Full Details →
          </Link>
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="borderRadius: 16px 0 0 16px"] {
            border-radius: 16px 16px 0 0 !important;
            max-height: 300px !important;
          }
        }
      `}</style>
    </div>
  );
}
