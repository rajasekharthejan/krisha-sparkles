"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

export default function FeaturedSlider({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const sync = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [products]);

  const slide = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(".slider-card") as HTMLElement;
    const step = (card?.offsetWidth ?? 280) + 20;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", padding: "0 0.5rem" }}>
      {/* Left Arrow */}
      <button
        className="slider-arrow slider-arrow-left"
        onClick={() => slide("left")}
        style={{ opacity: canLeft ? 1 : 0, pointerEvents: canLeft ? "auto" : "none" }}
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Right Arrow */}
      <button
        className="slider-arrow slider-arrow-right"
        onClick={() => slide("right")}
        style={{ opacity: canRight ? 1 : 0, pointerEvents: canRight ? "auto" : "none" }}
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* Track */}
      <div
        ref={scrollRef}
        className="snap-scroll"
        onScroll={sync}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="slider-card"
            style={{
              width: "clamp(220px, 26vw, 290px)",
              animation: `slideUp 0.5s ease both`,
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.5rem" }}>
        {products.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === 0 ? "20px" : "6px",
              height: "6px",
              borderRadius: "9999px",
              background: i === 0 ? "var(--gold)" : "rgba(201,168,76,0.25)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
