"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Star, Camera, Loader2 } from "lucide-react";
import type { GalleryReview } from "@/types";
import GalleryLightbox from "@/components/store/GalleryLightbox";
import { CATEGORIES } from "@/lib/utils";

const MIN_RATING_OPTIONS = [
  { label: "All Ratings", value: 0 },
  { label: "4+ Stars", value: 4 },
  { label: "5 Stars Only", value: 5 },
];

export default function GalleryPageClient() {
  const [reviews, setReviews] = useState<GalleryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fetchReviews = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
        });
        if (selectedCategory) params.set("category", selectedCategory);
        if (minRating > 0) params.set("min_rating", String(minRating));

        const res = await fetch(`/api/reviews/gallery?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();

        if (append) {
          setReviews((prev) => [...prev, ...json.reviews]);
        } else {
          setReviews(json.reviews || []);
        }
        setTotal(json.total || 0);
        setHasMore(json.hasMore || false);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, minRating]
  );

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchReviews(1);
  }, [fetchReviews]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchReviews(next, true);
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "3rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <span className="badge-gold">
            <Camera size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
            Customer Gallery
          </span>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              margin: "0.75rem 0 0.25rem",
            }}
          >
            Real Customers, Real Sparkle
          </h1>
          <div className="gold-divider" />
          <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem", maxWidth: "500px", margin: "0.75rem auto 0" }}>
            See how our community styles their Krisha Sparkles jewelry. Every photo is from a verified purchase review.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
          {/* Category filters */}
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
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}

          {/* Separator */}
          <span style={{ width: "1px", height: "24px", background: "var(--gold-border)", margin: "0 0.25rem" }} />

          {/* Rating filter */}
          {MIN_RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMinRating(opt.value)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                border: "1px solid",
                borderColor: minRating === opt.value ? "var(--gold)" : "rgba(201,168,76,0.2)",
                background: minRating === opt.value ? "var(--gold-muted)" : "transparent",
                color: minRating === opt.value ? "var(--gold)" : "var(--muted)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {opt.value > 0 && <Star size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px", fill: "currentColor" }} />}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Total count */}
        <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
          {loading ? "Loading..." : `${total} photo review${total !== 1 ? "s" : ""}`}
        </p>

        {/* Gallery Grid */}
        {loading ? (
          <div className="gallery-grid">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="shimmer-box" style={{ borderRadius: "12px", height: `${200 + (i % 3) * 60}px`, marginBottom: "1rem" }} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <Camera size={48} style={{ color: "var(--subtle)", marginBottom: "1rem" }} />
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", color: "var(--text)", marginBottom: "0.5rem" }}>
              No Photo Reviews Yet
            </h3>
            <p style={{ color: "var(--muted)", maxWidth: "400px", margin: "0 auto" }}>
              Be the first to share a photo! Purchase a product and leave a review with your photos to be featured here.
            </p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {reviews.map((review, idx) => (
                <div
                  key={review.id}
                  className="gallery-card"
                  onClick={() => setLightboxIdx(idx)}
                  style={{ cursor: "pointer", marginBottom: "1rem" }}
                >
                  {/* Review Image */}
                  <div style={{ position: "relative", borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
                    <Image
                      src={review.images[0]}
                      alt={`Review by ${review.user_profiles?.first_name || "Customer"}`}
                      width={400}
                      height={400}
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    {review.images.length > 1 && (
                      <span style={{
                        position: "absolute", top: "0.5rem", right: "0.5rem",
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        fontSize: "0.65rem", padding: "0.15rem 0.5rem",
                        borderRadius: "999px", backdropFilter: "blur(4px)",
                      }}>
                        +{review.images.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: "0.75rem" }}>
                    {/* Stars */}
                    <div style={{ display: "flex", gap: "2px", marginBottom: "0.35rem" }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} style={{
                          color: s <= review.rating ? "var(--gold)" : "var(--subtle)",
                          fill: s <= review.rating ? "var(--gold)" : "none",
                        }} />
                      ))}
                    </div>

                    {/* Product name */}
                    <p style={{
                      fontSize: "0.78rem", fontWeight: 600, color: "var(--text)",
                      margin: "0 0 0.2rem",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {review.products?.name || "Product"}
                    </p>

                    {/* Reviewer */}
                    <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: 0 }}>
                      by {review.user_profiles?.first_name || "Verified Buyer"}
                      {review.verified_purchase && (
                        <span style={{ color: "#10b981", marginLeft: "0.35rem" }}>✓</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-gold-outline"
                  style={{ padding: "0.75rem 2rem", fontSize: "0.875rem", gap: "0.5rem" }}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Loading...
                    </>
                  ) : (
                    "Load More Photos"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && reviews[lightboxIdx] && (
        <GalleryLightbox
          review={reviews[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
          onNext={lightboxIdx < reviews.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
        />
      )}
    </div>
  );
}
