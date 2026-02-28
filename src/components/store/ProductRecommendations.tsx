"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

interface ProductRecommendationsProps {
  productId: string;
}

function SkeletonCard() {
  return (
    <div
      style={{
        flexShrink: 0,
        width: "200px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--surface)",
        border: "1px solid var(--gold-border)",
      }}
    >
      {/* Image skeleton */}
      <div
        style={{
          width: "100%",
          height: "200px",
          background: "linear-gradient(90deg, var(--surface) 25%, var(--elevated) 50%, var(--surface) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
      {/* Text skeletons */}
      <div style={{ padding: "0.75rem" }}>
        <div
          style={{
            height: "10px",
            width: "60%",
            borderRadius: "4px",
            background: "var(--elevated)",
            marginBottom: "8px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            height: "13px",
            width: "85%",
            borderRadius: "4px",
            background: "var(--elevated)",
            marginBottom: "6px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            height: "12px",
            width: "40%",
            borderRadius: "4px",
            background: "var(--elevated)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const image = product.images?.[0] ?? "";
  const hasDiscount =
    product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) *
          100
      )
    : 0;

  return (
    <Link
      href={`/shop/${product.slug}`}
      style={{
        flexShrink: 0,
        width: "200px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--surface)",
        border: "1px solid var(--gold-border)",
        textDecoration: "none",
        display: "block",
        transition: "border-color 0.2s ease, transform 0.2s ease",
        animation: "scaleIn 0.4s ease both",
        animationDelay: `${index * 0.08}s`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "var(--gold)";
        (e.currentTarget as HTMLAnchorElement).style.transform =
          "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "var(--gold-border)";
        (e.currentTarget as HTMLAnchorElement).style.transform =
          "translateY(0)";
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "200px",
          background: "var(--elevated)",
          overflow: "hidden",
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="200px"
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
              fontSize: "2.5rem",
            }}
          >
            💎
          </div>
        )}
        {hasDiscount && (
          <span
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              padding: "0.12rem 0.45rem",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              borderRadius: "9999px",
              fontSize: "0.6rem",
              fontWeight: 700,
            }}
          >
            -{discountPct}%
          </span>
        )}
        {product.stock_quantity === 0 && (
          <span
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              padding: "0.12rem 0.45rem",
              background: "rgba(60,60,60,0.9)",
              color: "#ccc",
              borderRadius: "9999px",
              fontSize: "0.6rem",
              fontWeight: 600,
            }}
          >
            Sold Out
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "0.75rem 0.875rem 0.875rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            color: "var(--gold)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
            opacity: 0.8,
            marginBottom: "3px",
          }}
        >
          {product.category?.name ?? "Jewelry"}
        </p>
        <h4
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "0.4rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {product.name}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--gold)",
            }}
          >
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--subtle)",
                textDecoration: "line-through",
              }}
            >
              ${product.compare_price!.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductRecommendations({
  productId,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetch(`/api/recommendations?product_id=${productId}&limit=4`)
      .then((r) => r.json())
      .then(({ recommendations: recs }: { recommendations: Product[] }) => {
        setRecommendations(recs ?? []);
      })
      .catch(() => {
        setRecommendations([]);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Don't render anything if no recommendations and not loading
  if (!loading && recommendations.length === 0) return null;

  return (
    <section
      style={{
        marginTop: "3rem",
        paddingTop: "2.5rem",
        borderTop: "1px solid var(--gold-border)",
      }}
    >
      {/* Heading */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>✨</span>
        <h2
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            background:
              "linear-gradient(135deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          You May Also Love
        </h2>
      </div>

      {/* Scrollable cards row */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--gold-dark) var(--surface)",
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : recommendations.map((product, i) => (
              <RecommendationCard key={product.id} product={product} index={i} />
            ))}
      </div>
    </section>
  );
}
