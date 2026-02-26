"use client";

import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/store/ProductCard";
import type { Product } from "@/types";
import { ArrowRight } from "lucide-react";

interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  hero_image: string | null;
}

interface Props {
  collection: Collection;
  products: Product[];
}

export default function CollectionPageClient({ collection, products }: Props) {
  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <section
        style={{
          position: "relative",
          height: "380px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: collection.hero_image
            ? "transparent"
            : "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.12) 0%, #0a0a0a 70%)",
        }}
      >
        {collection.hero_image && (
          <Image src={collection.hero_image} alt={collection.title} fill style={{ objectFit: "cover", opacity: 0.35 }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.7))",
          }}
        />
        <div style={{ position: "relative", textAlign: "center", padding: "0 2rem" }}>
          <span className="badge-gold" style={{ marginBottom: "1rem", display: "inline-block" }}>✦ Collection</span>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            {collection.title}
          </h1>
          {collection.description && (
            <p
              style={{
                color: "rgba(245,245,245,0.8)",
                fontSize: "1rem",
                lineHeight: 1.7,
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Products */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>💎</p>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", marginBottom: "1rem" }}>Coming Soon</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>We&apos;re curating this collection. Check back soon!</p>
            <Link href="/shop" className="btn-gold">Browse All Products <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{products.length} product{products.length !== 1 ? "s" : ""}</p>
              <Link href="/shop" style={{ color: "var(--gold)", fontSize: "0.875rem", textDecoration: "none" }}>Shop All →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
