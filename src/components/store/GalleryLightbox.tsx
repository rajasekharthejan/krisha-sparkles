"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Star, ShoppingBag, CheckCircle } from "lucide-react";
import type { GalleryReview } from "@/types";

interface Props {
  review: GalleryReview;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function GalleryLightbox({ review, onClose, onPrev, onNext }: Props) {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  const reviewerName = review.user_profiles?.first_name || "Verified Buyer";
  const productName = review.products?.name || "Product";
  const productSlug = review.products?.slug || "";
  const productImage = review.products?.images?.[0] || "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.94)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: "50%", width: "40px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff", zIndex: 2,
        }}
      >
        <X size={18} />
      </button>

      {/* Prev */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={{
            position: "absolute", left: "1rem",
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: "50%", width: "44px", height: "44px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", zIndex: 2,
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "85vh",
          background: "var(--surface)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--gold-border)",
        }}
        className="gallery-lightbox-grid"
      >
        {/* Left: Image */}
        <div style={{ position: "relative", minHeight: "400px", background: "var(--elevated)" }}>
          <Image
            src={review.images[activeImg] || review.images[0]}
            alt={`Review by ${reviewerName}`}
            fill
            style={{ objectFit: "cover" }}
            sizes="450px"
          />
          {review.images.length > 1 && (
            <div style={{
              position: "absolute", bottom: "0.75rem", left: "50%",
              transform: "translateX(-50%)",
              display: "flex", gap: "0.35rem",
            }}>
              {review.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: i === activeImg ? "20px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: i === activeImg ? "var(--gold)" : "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Review details */}
        <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
          {/* Reviewer */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "var(--gold-muted)", border: "1.5px solid var(--gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--gold)", fontWeight: 700, fontSize: "0.9rem",
            }}>
              {reviewerName[0]?.toUpperCase() || "V"}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{reviewerName}</p>
              <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={13} style={{
                    color: s <= review.rating ? "var(--gold)" : "var(--subtle)",
                    fill: s <= review.rating ? "var(--gold)" : "none",
                  }} />
                ))}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: 0 }}>
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
              {review.verified_purchase && (
                <span style={{ fontSize: "0.65rem", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
                  <CheckCircle size={10} /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Review text */}
          {review.title && (
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              {review.title}
            </h3>
          )}
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.7, margin: 0 }}>
            {review.body}
          </p>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--gold-border)", margin: "0.5rem 0" }} />

          {/* Shop This Look */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {productImage && (
              <div style={{ width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--gold-border)", flexShrink: 0 }}>
                <Image src={productImage} alt={productName} width={52} height={52} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Shop This Look
              </p>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
                {productName}
              </p>
            </div>
          </div>
          <Link
            href={`/shop/${productSlug}`}
            className="btn-gold"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", padding: "0.75rem", fontSize: "0.85rem",
              borderRadius: "8px", textDecoration: "none",
            }}
          >
            <ShoppingBag size={16} />
            Shop This Look
          </Link>
        </div>
      </div>

      {/* Next */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={{
            position: "absolute", right: "1rem",
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: "50%", width: "44px", height: "44px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", zIndex: 2,
          }}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Keyboard hint */}
      <p style={{
        position: "absolute", bottom: "1rem", left: "50%",
        transform: "translateX(-50%)", color: "rgba(255,255,255,0.4)",
        fontSize: "0.75rem",
      }}>
        ← → Navigate · Esc to close
      </p>

      <style>{`
        @media (max-width: 768px) {
          .gallery-lightbox-grid {
            grid-template-columns: 1fr !important;
            max-height: 90vh !important;
          }
        }
      `}</style>
    </div>
  );
}
