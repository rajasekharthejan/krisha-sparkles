"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .eq("active", true)
        .limit(8);
      setResults((data as Product[]) || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 320);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(product: Product) {
    onClose();
    router.push(`/shop/${product.slug}`);
  }

  function handleSearchAll() {
    if (!query.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  }

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "rgba(10,10,10,0.98)",
          border: "1px solid var(--gold-border)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "640px",
          margin: "0 1rem",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.1)",
          animation: "zoomIn 0.2s ease",
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--gold-border)" }}>
          {loading ? (
            <Loader2 size={20} style={{ color: "var(--gold)", animation: "spin 1s linear infinite", flexShrink: 0 }} />
          ) : (
            <Search size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearchAll(); }}
            placeholder="Search jewelry, necklaces, earrings..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: "1rem",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              padding: "4px",
              borderRadius: "6px",
              flexShrink: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div style={{ maxHeight: "420px", overflowY: "auto" }}>
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="search-result-item"
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.name} width={48} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>💎</div>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: "0.9rem", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {product.name}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0 }}>
                    {product.category?.name || "Jewelry"}
                  </p>
                </div>
                <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                  {formatPrice(product.price)}
                </span>
              </button>
            ))}
            {/* View all */}
            <button
              onClick={handleSearchAll}
              style={{
                width: "100%",
                padding: "0.875rem 1.25rem",
                background: "var(--gold-muted)",
                border: "none",
                borderTop: "1px solid var(--gold-border)",
                cursor: "pointer",
                color: "var(--gold)",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold-muted)")}
            >
              <Search size={14} />
              View all results for &ldquo;{query}&rdquo;
            </button>
          </div>
        ) : query.length >= 2 && !loading ? (
          <div style={{ padding: "2.5rem 1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</p>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No products found for &ldquo;{query}&rdquo;</p>
            <p style={{ color: "var(--subtle)", fontSize: "0.8rem", marginTop: "0.5rem" }}>Try a different keyword or browse our collection</p>
          </div>
        ) : query.length === 0 ? (
          <div style={{ padding: "1.5rem 1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "1rem" }}>
              Quick Browse
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Necklaces", "Earrings", "Bangles", "Jadau", "Pendant Sets", "Dresses"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onClose();
                    router.push(`/shop?category=${cat.toLowerCase().replace(/ /g, "-")}`);
                  }}
                  className="badge-gold"
                  style={{ cursor: "pointer", background: "none", border: "1px solid var(--gold-border)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gold-muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer hint */}
        <div style={{ padding: "0.6rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "flex-end", gap: "1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--subtle)" }}>↵ to search all</span>
          <span style={{ fontSize: "0.7rem", color: "var(--subtle)" }}>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
