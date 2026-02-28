"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

interface CartRecommendationsProps {
  firstCartItemProductId?: string;
}

function CompactSkeletonCard() {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        alignItems: "center",
        padding: "0.5rem",
        borderRadius: "8px",
        background: "var(--elevated)",
        border: "1px solid var(--gold-border)",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "6px",
          flexShrink: 0,
          background: "linear-gradient(90deg, var(--elevated) 25%, var(--surface) 50%, var(--elevated) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: "9px",
            width: "70%",
            borderRadius: "3px",
            background: "var(--surface)",
            marginBottom: "6px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            height: "11px",
            width: "45%",
            borderRadius: "3px",
            background: "var(--surface)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
    </div>
  );
}

function CompactCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? "";
  const { addItem, openCart } = useCartStore();

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image,
      slug: product.slug,
    });
    // Cart is already open so no need to call openCart()
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        alignItems: "center",
        padding: "0.5rem",
        borderRadius: "8px",
        background: "var(--elevated)",
        border: "1px solid var(--gold-border)",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--gold-border)")
      }
    >
      {/* Thumbnail */}
      <Link
        href={`/shop/${product.slug}`}
        style={{
          position: "relative",
          width: "52px",
          height: "52px",
          borderRadius: "6px",
          flexShrink: 0,
          overflow: "hidden",
          background: "var(--surface)",
          display: "block",
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="52px"
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
              fontSize: "1.5rem",
            }}
          >
            💎
          </div>
        )}
      </Link>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/shop/${product.slug}`}
          style={{ textDecoration: "none" }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: "2px",
            }}
          >
            {product.name}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--gold)",
            }}
          >
            ${product.price.toFixed(2)}
          </p>
        </Link>
      </div>

      {/* Quick-add button */}
      {product.stock_quantity > 0 ? (
        <button
          onClick={handleQuickAdd}
          style={{
            flexShrink: 0,
            padding: "0.3rem 0.6rem",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #c9a84c, #e8c96a)",
            border: "none",
            color: "#0a0a0a",
            fontSize: "0.68rem",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          + Add
        </button>
      ) : (
        <span
          style={{
            flexShrink: 0,
            padding: "0.3rem 0.5rem",
            borderRadius: "6px",
            background: "rgba(80,80,80,0.5)",
            color: "#999",
            fontSize: "0.65rem",
            fontWeight: 600,
          }}
        >
          Sold Out
        </span>
      )}
    </div>
  );
}

export default function CartRecommendations({
  firstCartItemProductId,
}: CartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firstCartItemProductId) {
      setRecommendations([]);
      return;
    }
    setLoading(true);
    fetch(
      `/api/recommendations?product_id=${firstCartItemProductId}&limit=4`
    )
      .then((r) => r.json())
      .then(({ recommendations: recs }: { recommendations: Product[] }) => {
        setRecommendations(recs ?? []);
      })
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, [firstCartItemProductId]);

  if (!firstCartItemProductId) return null;
  if (!loading && recommendations.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "1.25rem",
        paddingTop: "1.25rem",
        borderTop: "1px solid var(--gold-border)",
      }}
    >
      {/* Section header */}
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--gold)",
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <span>✨</span> Complete Your Look
      </p>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <CompactSkeletonCard key={i} />
            ))
          : recommendations.slice(0, 4).map((product) => (
              <CompactCard key={product.id} product={product} />
            ))}
      </div>
    </div>
  );
}
