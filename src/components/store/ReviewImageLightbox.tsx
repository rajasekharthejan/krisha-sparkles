"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props { images: string[]; }

export default function ReviewImageLightbox({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex(i => i !== null ? Math.min(i + 1, images.length - 1) : null);
      if (e.key === "ArrowLeft") setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            style={{ width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden", border: "2px solid var(--gold-border)", background: "var(--elevated)", cursor: "pointer", padding: 0, flexShrink: 0, transition: "border-color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--gold-border)")}
          >
            <Image src={url} alt={`Review photo ${i + 1}`} width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
          >
            <X size={18} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : null); }}
              style={{ position: "absolute", left: "1rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", position: "relative" }}>
            <Image
              src={images[lightboxIndex]}
              alt={`Review photo ${lightboxIndex + 1}`}
              width={800}
              height={800}
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }}
            />
          </div>

          {lightboxIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : null); }}
              style={{ position: "absolute", right: "1rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <ChevronRight size={20} />
            </button>
          )}

          <p style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
            {lightboxIndex + 1} / {images.length} · Press Esc to close
          </p>
        </div>
      )}
    </>
  );
}
