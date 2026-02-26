"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/store/ProductCard";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import type { Product } from "@/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("active", true);

    if (selectedCategory) {
      query = query.eq("categories.slug", selectedCategory);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

    if (sortBy === "newest") query = query.order("created_at", { ascending: false });
    else if (sortBy === "price-asc") query = query.order("price", { ascending: true });
    else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
    else if (sortBy === "featured") query = query.eq("featured", true).order("created_at", { ascending: false });

    const { data } = await query;
    setProducts((data as Product[]) || []);
    setLoading(false);
  }, [selectedCategory, search, sortBy, priceRange]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

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
          <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
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
            marginBottom: "2rem",
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
            style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
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
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setSortBy("newest");
              }}
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
              <ProductCard key={product.id} product={product} />
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
