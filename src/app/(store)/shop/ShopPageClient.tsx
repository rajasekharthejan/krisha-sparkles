"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { CATEGORIES, MATERIALS, COLORS, OCCASIONS, STYLES } from "@/lib/utils";
import type { Product } from "@/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

// ── Pill component for filter options ─────────────────────────────────────────
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.3rem 0.75rem",
        borderRadius: "9999px",
        border: "1px solid",
        borderColor: active ? "var(--gold)" : "rgba(201,168,76,0.15)",
        background: active ? "var(--gold-muted)" : "transparent",
        color: active ? "var(--gold)" : "var(--muted)",
        fontSize: "0.75rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Color swatch component ────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  Gold: "#c9a84c",
  Silver: "#c0c0c0",
  "Rose Gold": "#e8a090",
  Multi: "linear-gradient(135deg, #c9a84c 0%, #e8a090 33%, #c0c0c0 66%, #10b981 100%)",
  Green: "#10b981",
  Red: "#ef4444",
  White: "#f5f5f5",
  Pink: "#ec4899",
};

function ColorSwatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const bg = COLOR_MAP[color] || "#888";
  const isGradient = bg.startsWith("linear");
  return (
    <button
      onClick={onClick}
      title={color}
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: active ? "2px solid var(--gold)" : "2px solid transparent",
        outline: active ? "2px solid var(--gold)" : "none",
        outlineOffset: "2px",
        background: isGradient ? bg : bg,
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          bottom: "-16px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.6rem",
          color: active ? "var(--gold)" : "var(--muted)",
          whiteSpace: "nowrap",
        }}
      >
        {color}
      </span>
    </button>
  );
}

interface ReviewStatsMap {
  [productId: string]: { avg_rating: number; review_count: number };
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [reviewStats, setReviewStats] = useState<ReviewStatsMap>({});

  // ── Advanced filter state ──────────────────────────────────────────────────
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get("material") || "");
  const [selectedColor, setSelectedColor] = useState(searchParams.get("color") || "");
  const [selectedOccasion, setSelectedOccasion] = useState(searchParams.get("occasion") || "");
  const [selectedStyle, setSelectedStyle] = useState(searchParams.get("style") || "");

  // Count active filters (excluding category which is always visible)
  const activeFilterCount = [selectedMaterial, selectedColor, selectedOccasion, selectedStyle].filter(Boolean).length
    + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0);

  // Auto-open filters if URL has advanced filter params
  useEffect(() => {
    if (selectedMaterial || selectedColor || selectedOccasion || selectedStyle) {
      setShowFilters(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync filters to URL ────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedMaterial) params.set("material", selectedMaterial);
    if (selectedColor) params.set("color", selectedColor);
    if (selectedOccasion) params.set("occasion", selectedOccasion);
    if (selectedStyle) params.set("style", selectedStyle);
    if (search) params.set("search", search);
    if (sortBy !== "newest") params.set("sort", sortBy);
    const qs = params.toString();
    router.replace(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [selectedCategory, selectedMaterial, selectedColor, selectedOccasion, selectedStyle, search, sortBy, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("active", true);

    if (selectedCategory) {
      // Resolve category slug → id first (PostgREST join filters don't work as WHERE clauses)
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", selectedCategory)
        .single();
      if (catData?.id) {
        query = query.eq("category_id", catData.id);
      } else {
        setProducts([]);
        setLoading(false);
        return;
      }
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (selectedMaterial) {
      query = query.eq("material", selectedMaterial);
    }
    if (selectedColor) {
      query = query.eq("color", selectedColor);
    }
    if (selectedOccasion) {
      query = query.eq("occasion", selectedOccasion);
    }
    if (selectedStyle) {
      query = query.eq("style", selectedStyle);
    }
    query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

    if (sortBy === "newest") query = query.order("created_at", { ascending: false });
    else if (sortBy === "price-asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
    else if (sortBy === "featured") query = query.eq("featured", true).order("created_at", { ascending: false });

    const { data } = await query;
    const prods = (data as Product[]) || [];
    setProducts(prods);
    setLoading(false);

    // Fetch batch review stats for displayed products
    if (prods.length > 0) {
      try {
        const ids = prods.map((p) => p.id).join(",");
        const res = await fetch(`/api/reviews/stats?product_ids=${ids}`);
        if (res.ok) {
          const json = await res.json();
          const map: ReviewStatsMap = {};
          for (const s of json.stats || []) {
            map[s.product_id] = { avg_rating: s.avg_rating, review_count: s.review_count };
          }
          setReviewStats(map);
        }
      } catch {
        // silently ignore — stars just won't show
      }
    }
  }, [selectedCategory, search, sortBy, priceRange, selectedMaterial, selectedColor, selectedOccasion, selectedStyle]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedMaterial("");
    setSelectedColor("");
    setSelectedOccasion("");
    setSelectedStyle("");
    setSortBy("newest");
    setPriceRange([0, 500]);
  };

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Page Header */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <span className="badge-gold">Our Collection</span>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              margin: "0.75rem 0 0.25rem",
            }}
          >
            Shop All Jewelry
          </h1>
          <div className="gold-divider" />
          <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem" }} suppressHydrationWarning>
            {products.length} {products.length === 1 ? "piece" : "pieces"} available
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Search & Sort Bar */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search jewelry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: "2.5rem" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: "relative" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-dark"
              style={{ paddingRight: "2.5rem", appearance: "none", minWidth: "160px", cursor: "pointer" }}
            >
              <option value="newest">Newest First</option>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "btn-gold" : "btn-gold-outline"}
            style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "var(--gold)",
                  color: "#000",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSelectedCategory("")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "9999px",
              border: "1px solid",
              borderColor: selectedCategory === "" ? "var(--gold)" : "rgba(201,168,76,0.2)",
              background: selectedCategory === "" ? "var(--gold-muted)" : "transparent",
              color: selectedCategory === "" ? "var(--gold)" : "var(--muted)",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                border: "1px solid",
                borderColor: selectedCategory === cat.slug ? "var(--gold)" : "rgba(201,168,76,0.2)",
                background: selectedCategory === cat.slug ? "var(--gold-muted)" : "transparent",
                color: selectedCategory === cat.slug ? "var(--gold)" : "var(--muted)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* ══ Advanced Filters Panel ══════════════════════════════════════════════ */}
        {showFilters && (
          <div
            className="glass"
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              animation: "fadeInDown 0.25s ease",
            }}
          >
            {/* Price Range */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Price Range
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="input-dark"
                  style={{ width: "80px", fontSize: "0.8rem", padding: "0.4rem 0.5rem" }}
                  placeholder="Min"
                />
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="input-dark"
                  style={{ width: "80px", fontSize: "0.8rem", padding: "0.4rem 0.5rem" }}
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Material */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Material
              </p>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {MATERIALS.map((m) => (
                  <FilterPill
                    key={m}
                    label={m}
                    active={selectedMaterial === m}
                    onClick={() => setSelectedMaterial(selectedMaterial === m ? "" : m)}
                  />
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Color
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingBottom: "18px" }}>
                {COLORS.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    active={selectedColor === c}
                    onClick={() => setSelectedColor(selectedColor === c ? "" : c)}
                  />
                ))}
              </div>
            </div>

            {/* Occasion */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Occasion
              </p>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {OCCASIONS.map((o) => (
                  <FilterPill
                    key={o}
                    label={o}
                    active={selectedOccasion === o}
                    onClick={() => setSelectedOccasion(selectedOccasion === o ? "" : o)}
                  />
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Style
              </p>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {STYLES.map((s) => (
                  <FilterPill
                    key={s}
                    label={s}
                    active={selectedStyle === s}
                    onClick={() => setSelectedStyle(selectedStyle === s ? "" : s)}
                  />
                ))}
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <X size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && !showFilters && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {selectedMaterial && (
              <span
                onClick={() => setSelectedMaterial("")}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {selectedMaterial} <X size={10} />
              </span>
            )}
            {selectedColor && (
              <span
                onClick={() => setSelectedColor("")}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {selectedColor} <X size={10} />
              </span>
            )}
            {selectedOccasion && (
              <span
                onClick={() => setSelectedOccasion("")}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {selectedOccasion} <X size={10} />
              </span>
            )}
            {selectedStyle && (
              <span
                onClick={() => setSelectedStyle("")}
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  background: "var(--gold-muted)",
                  color: "var(--gold)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {selectedStyle} <X size={10} />
              </span>
            )}
            <span
              onClick={clearAllFilters}
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Clear All
            </span>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="shimmer-box"
                style={{ borderRadius: "12px", aspectRatio: "1" }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "6rem 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "4rem" }}>💎</span>
            <h3
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.5rem",
                color: "var(--text)",
              }}
            >
              No products found
            </h3>
            <p style={{ color: "var(--muted)" }}>
              Try adjusting your filters or search term
            </p>
            <button
              onClick={clearAllFilters}
              className="btn-gold-outline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                avgRating={reviewStats[product.id]?.avg_rating}
                reviewCount={reviewStats[product.id]?.review_count}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPageClient() {
  return (
    <Suspense fallback={
      <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--gold)", fontSize: "2rem" }}>✦</div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
