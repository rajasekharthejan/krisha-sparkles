"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import { Clock, X } from "lucide-react";
import type { Product } from "@/types";

const STORAGE_KEY = "krisha_recently_viewed";
const MAX_ITEMS = 10;

/** Add a product ID to the recently viewed list (call on product page mount) */
export function addToRecentlyViewed(productId: string) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
    const filtered = stored.filter((id) => id !== productId);
    filtered.unshift(productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable
  }
}

/** Get recently viewed product IDs */
function getRecentlyViewedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

/** Clear all recently viewed */
function clearRecentlyViewed() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

interface RecentlyViewedProps {
  /** Exclude this product ID (e.g., the current product page) */
  excludeId?: string;
}

export default function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const ids = getRecentlyViewedIds().filter((id) => id !== excludeId);
    if (ids.length === 0) return;

    const supabase = createClient();
    supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .in("id", ids)
      .eq("active", true)
      .then(({ data }) => {
        if (data) {
          // Sort by the order in recently viewed (most recent first)
          const sorted = ids
            .map((id) => data.find((p) => p.id === id))
            .filter(Boolean) as Product[];
          setProducts(sorted);
        }
      });
  }, [excludeId]);

  if (cleared || products.length === 0) return null;

  return (
    <div style={{ marginTop: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={18} style={{ color: "var(--gold)" }} />
          <h3
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
            }}
          >
            Recently Viewed
          </h3>
        </div>
        <button
          onClick={() => {
            clearRecentlyViewed();
            setCleared(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <X size={12} /> Clear
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          scrollSnapType: "x mandatory",
        }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            style={{
              minWidth: "200px",
              maxWidth: "220px",
              scrollSnapAlign: "start",
              flex: "0 0 auto",
            }}
          >
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
