"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

interface StickyMobileCartProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productSlug: string;
  inStock: boolean;
  /** Ref to the main "Add to Cart" button to observe visibility */
  addToCartRef: React.RefObject<HTMLButtonElement | null>;
}

export default function StickyMobileCart({
  productId,
  productName,
  productPrice,
  productImage,
  productSlug,
  inStock,
  addToCartRef,
}: StickyMobileCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Observe the main Add to Cart button
  useEffect(() => {
    const target = addToCartRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main button is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observerRef.current.observe(target);
    return () => {
      observerRef.current?.disconnect();
    };
  }, [addToCartRef]);

  const handleAdd = useCallback(() => {
    addItem({
      productId,
      name: productName,
      price: productPrice,
      image: productImage,
      slug: productSlug,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }, [addItem, productId, productName, productPrice, productImage, productSlug, openCart]);

  if (!inStock) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: "var(--elevated)",
        borderTop: "1px solid var(--gold-border)",
        padding: "0.75rem 1rem",
        display: isVisible ? "flex" : "none",
        alignItems: "center",
        gap: "0.75rem",
        backdropFilter: "blur(12px)",
        animation: isVisible ? "slideUp 0.3s ease" : "none",
      }}
      className="md-hidden-sticky"
    >
      {/* Product info */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {productName}
        </p>
        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--gold)", margin: "2px 0 0" }}>
          {formatPrice(productPrice)}
        </p>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAdd}
        className="btn-gold"
        style={{
          padding: "0.65rem 1.25rem",
          fontSize: "0.8rem",
          gap: "0.4rem",
          whiteSpace: "nowrap",
          background: added ? "linear-gradient(135deg, #10b981, #059669)" : undefined,
        }}
      >
        {added ? <Check size={14} /> : <ShoppingBag size={14} />}
        {added ? "Added!" : "Add to Cart"}
      </button>

      {/* CSS: only show on mobile */}
      <style>{`
        @media (min-width: 768px) {
          .md-hidden-sticky { display: none !important; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
