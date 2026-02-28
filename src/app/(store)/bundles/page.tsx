import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bundle Deals | Krisha Sparkles",
  description:
    "Shop our handpicked jewelry bundles and save more. Mix and match necklaces, earrings, bangles, and more at unbeatable bundle prices.",
  openGraph: {
    title: "Bundle Deals | Krisha Sparkles",
    description:
      "Handpicked jewelry bundles at unbeatable prices. Save more when you shop our curated sets.",
    images: [{ url: "https://shopkrisha.com/logo.png", width: 800, height: 800 }],
  },
};

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface BundleItem {
  id: string;
  product_id: string;
  products: BundleProduct;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  compare_price: number | null;
  active: boolean;
  created_at: string;
  bundle_items: BundleItem[];
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getActiveBundles(): Promise<Bundle[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("bundles")
    .select(
      `
      id, name, slug, description, image, bundle_price, compare_price, active, created_at,
      bundle_items (
        id, product_id,
        products (id, name, slug, price, images)
      )
    `
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  return ((data as unknown) as Bundle[]) || [];
}

export default async function BundlesPage() {
  const bundles = await getActiveBundles();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "4rem 1.5rem 3rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            color: "var(--gold)",
            marginBottom: "0.75rem",
          }}
        >
          Bundle Deals
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto" }}>
          Curated jewelry bundles at unbeatable prices. Save more when you shop our handpicked sets.
        </p>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {bundles.length === 0 ? (
          // Empty state
          <div
            style={{
              textAlign: "center",
              padding: "5rem 2rem",
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <Package size={56} strokeWidth={1} style={{ color: "var(--gold)", opacity: 0.5 }} />
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", fontWeight: 700 }}>
              No Bundles Yet
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: "360px" }}>
              We are putting together some amazing deals. Check back soon!
            </p>
            <Link href="/shop" className="btn-gold" style={{ marginTop: "0.5rem" }}>
              Shop All Products
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {bundles.map((bundle) => {
              const savings =
                bundle.compare_price && bundle.compare_price > bundle.bundle_price
                  ? bundle.compare_price - bundle.bundle_price
                  : null;

              const displayImage =
                bundle.image ||
                bundle.bundle_items?.[0]?.products?.images?.[0] ||
                null;

              return (
                <div
                  key={bundle.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  {/* Image area */}
                  <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--bg)" }}>
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={bundle.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0.3,
                        }}
                      >
                        <Package size={64} strokeWidth={1} />
                      </div>
                    )}

                    {/* Savings badge */}
                    {savings !== null && savings > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "0.75rem",
                          left: "0.75rem",
                          background: "var(--gold)",
                          color: "#000",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "9999px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        Save {formatPrice(savings)}
                      </div>
                    )}

                    {/* Product count badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                        background: "rgba(0,0,0,0.65)",
                        color: "var(--text)",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.25rem 0.6rem",
                        borderRadius: "9999px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {bundle.bundle_items?.length || 0} items
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <h2
                      style={{
                        fontFamily: "var(--font-playfair)",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      {bundle.name}
                    </h2>

                    {bundle.description && (
                      <p
                        style={{
                          color: "var(--muted)",
                          fontSize: "0.85rem",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {bundle.description}
                      </p>
                    )}

                    {/* Pricing */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-playfair)",
                          fontSize: "1.35rem",
                          fontWeight: 700,
                          color: "var(--gold)",
                        }}
                      >
                        {formatPrice(bundle.bundle_price)}
                      </span>
                      {bundle.compare_price && bundle.compare_price > bundle.bundle_price && (
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--muted)",
                            textDecoration: "line-through",
                          }}
                        >
                          {formatPrice(bundle.compare_price)}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/bundles/${bundle.slug}`}
                      className="btn-gold"
                      style={{ textAlign: "center", marginTop: "0.5rem", display: "block" }}
                    >
                      View Bundle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
