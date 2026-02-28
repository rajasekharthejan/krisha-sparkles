import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import BundleAddToCart from "./BundleAddToCart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[];
  stock_quantity: number;
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

async function getBundle(slug: string): Promise<Bundle | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bundles")
    .select(
      `
      id, name, slug, description, image, bundle_price, compare_price, active, created_at,
      bundle_items (
        id, product_id,
        products (id, name, slug, price, compare_price, images, stock_quantity)
      )
    `
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return (data as unknown) as Bundle;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getBundle(slug);
  if (!bundle) return { title: "Bundle Not Found" };

  const image =
    bundle.image ||
    bundle.bundle_items?.[0]?.products?.images?.[0] ||
    "https://shopkrisha.com/logo.png";

  return {
    title: `${bundle.name} | Krisha Sparkles`,
    description:
      bundle.description ||
      `Shop the ${bundle.name} bundle at Krisha Sparkles. ${bundle.bundle_items?.length || 0} items for ${formatPrice(bundle.bundle_price)}.`,
    openGraph: {
      title: `${bundle.name} | Krisha Sparkles`,
      description:
        bundle.description ||
        `Shop the ${bundle.name} bundle — ${bundle.bundle_items?.length || 0} items for ${formatPrice(bundle.bundle_price)}.`,
      images: [{ url: image, width: 800, height: 800, alt: bundle.name }],
    },
  };
}

export default async function BundleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getBundle(slug);

  if (!bundle) notFound();

  const savings =
    bundle.compare_price && bundle.compare_price > bundle.bundle_price
      ? bundle.compare_price - bundle.bundle_price
      : null;

  const displayImage =
    bundle.image || bundle.bundle_items?.[0]?.products?.images?.[0] || null;

  const originalTotal = bundle.bundle_items.reduce(
    (sum, item) => sum + (item.products?.price || 0),
    0
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Back link */}
        <Link
          href="/bundles"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--muted)",
            fontSize: "0.875rem",
            marginBottom: "2rem",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          All Bundles
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "start",
          }}
        >
          {/* Left — Bundle image */}
          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              background: "var(--surface)",
              border: "1px solid var(--gold-border)",
              aspectRatio: "1",
              position: "relative",
            }}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={bundle.name}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.25,
                  padding: "4rem",
                }}
              >
                <Tag size={80} strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Title + savings badge */}
            <div>
              {savings !== null && savings > 0 && (
                <div
                  style={{
                    display: "inline-block",
                    background: "var(--gold)",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "9999px",
                    marginBottom: "0.75rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  Save {formatPrice(savings)}
                </div>
              )}
              <h1
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {bundle.name}
              </h1>

              {bundle.description && (
                <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "0.75rem", lineHeight: 1.6 }}>
                  {bundle.description}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--gold)",
                  }}
                >
                  {formatPrice(bundle.bundle_price)}
                </span>
                {bundle.compare_price && bundle.compare_price > bundle.bundle_price && (
                  <span style={{ fontSize: "1rem", color: "var(--muted)", textDecoration: "line-through" }}>
                    {formatPrice(bundle.compare_price)}
                  </span>
                )}
              </div>
              {originalTotal > 0 && originalTotal !== bundle.bundle_price && (
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>
                  Individual items total: {formatPrice(originalTotal)}
                  {originalTotal > bundle.bundle_price && (
                    <span style={{ color: "var(--gold)", fontWeight: 600, marginLeft: "0.5rem" }}>
                      (You save {formatPrice(originalTotal - bundle.bundle_price)}!)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Add to Cart */}
            <BundleAddToCart
              bundleName={bundle.name}
              bundlePrice={bundle.bundle_price}
              items={bundle.bundle_items}
            />
          </div>
        </div>

        {/* Included Products */}
        <div style={{ marginTop: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--text)",
            }}
          >
            Included in This Bundle
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {bundle.bundle_items.map((item) => {
              const product = item.products;
              if (!product) return null;
              const productImage = product.images?.[0] || null;

              return (
                <Link
                  key={item.id}
                  href={`/shop/${product.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--gold-border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      transition: "border-color 0.2s",
                    }}
                  >
                    {/* Product image */}
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        background: "var(--bg)",
                      }}
                    >
                      {productImage ? (
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 640px) 50vw, 200px"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.2,
                          }}
                        >
                          <Tag size={32} strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "0.85rem" }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          margin: "0 0 0.35rem",
                          color: "var(--text)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.9rem" }}>
                          {formatPrice(product.price)}
                        </span>
                        {product.compare_price && product.compare_price > product.price && (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: "0.75rem",
                              textDecoration: "line-through",
                            }}
                          >
                            {formatPrice(product.compare_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
