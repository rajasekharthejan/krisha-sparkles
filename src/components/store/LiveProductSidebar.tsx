"use client";

import { ShoppingBag, Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { LiveEventProduct } from "@/types";

interface LiveProductSidebarProps {
  products: LiveEventProduct[];
  eventTitle: string;
}

export default function LiveProductSidebar({
  products,
  eventTitle,
}: LiveProductSidebarProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleAddToCart = (lep: LiveEventProduct) => {
    const product = lep.products;
    if (!product) return;

    const price = lep.special_price ?? product.price;

    addItem({
      productId: product.id,
      name: product.name,
      price,
      image: product.images?.[0] || "",
      quantity: 1,
      slug: product.slug,
      selectedVariant: `Live Event: ${eventTitle}`,
    });
    openCart();
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--surface, #141414)",
    borderRadius: "12px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    background: "var(--elevated, #1a1a1a)",
  };

  const headerTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--gold, #c9a84c)",
    fontFamily: "var(--font-playfair, serif)",
  };

  const countBadgeStyle: React.CSSProperties = {
    background: "rgba(201, 168, 76, 0.15)",
    color: "var(--gold, #c9a84c)",
    fontSize: "12px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "12px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "var(--bg, #0a0a0a)",
    borderRadius: "10px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    transition: "border-color 0.2s ease",
  };

  const imageStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    borderRadius: "8px",
    objectFit: "cover",
    flexShrink: 0,
    background: "var(--surface, #141414)",
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text, #f5f5f5)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "4px",
  };

  const priceRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
  };

  const specialPriceStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--gold, #c9a84c)",
  };

  const originalPriceStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--muted, #888)",
    textDecoration: "line-through",
  };

  const addBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--bg, #0a0a0a)",
    background: "var(--gold, #c9a84c)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
    whiteSpace: "nowrap",
  };

  const emptyStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px 20px",
    color: "var(--muted, #888)",
    fontSize: "14px",
    textAlign: "center",
  };

  if (!products || products.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={headerTitleStyle}>
            <Package size={18} />
            Featured Products
          </span>
        </div>
        <div style={emptyStyle}>
          <Package size={32} />
          <p>No products featured yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>
          <Package size={18} />
          Featured Products
        </span>
        <span style={countBadgeStyle}>{products.length}</span>
      </div>
      <div style={listStyle}>
        {products.map((lep) => {
          const product = lep.products;
          if (!product) return null;

          const hasSpecialPrice =
            lep.special_price != null && lep.special_price < product.price;
          const displayPrice = lep.special_price ?? product.price;

          return (
            <div key={lep.id} style={cardStyle}>
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  style={imageStyle}
                />
              ) : (
                <div
                  style={{
                    ...imageStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={24} color="var(--muted, #888)" />
                </div>
              )}
              <div style={infoStyle}>
                <p style={nameStyle}>{product.name}</p>
                <div style={priceRowStyle}>
                  <span style={specialPriceStyle}>
                    ${displayPrice.toFixed(2)}
                  </span>
                  {hasSpecialPrice && (
                    <span style={originalPriceStyle}>
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <button
                  style={addBtnStyle}
                  onClick={() => handleAddToCart(lep)}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.opacity = "0.85";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.opacity = "1";
                  }}
                >
                  <ShoppingBag size={12} />
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
