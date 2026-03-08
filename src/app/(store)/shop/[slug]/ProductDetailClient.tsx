"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Check, Share2, Truck, Shield, Star, Send, Loader2, X, Ruler, Camera, MessageCircle } from "lucide-react";
import { toggleGuestWishlist, isInGuestWishlist } from "@/lib/wishlistUtils";
import type { Product, Review } from "@/types";
import ProductCard from "@/components/store/ProductCard";
import ViewingNow from "@/components/store/ViewingNow";
import ReviewImageLightbox from "@/components/store/ReviewImageLightbox";
import BackInStockButton from "@/components/store/BackInStockButton";
import { trackEvent } from "@/lib/trackEvent";
import ProductRecommendations from "@/components/store/ProductRecommendations";
import RecentlyViewed, { addToRecentlyViewed } from "@/components/store/RecentlyViewed";
import StickyMobileCart from "@/components/store/StickyMobileCart";
import { openCrisp } from "@/components/store/CrispChat";

export default function ProductDetailClient({ slug: initialSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = initialSlug || params?.slug || "";
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [reviewImageUploading, setReviewImageUploading] = useState(false);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});
  const [avgRating, setAvgRating] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchProduct() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug)")
        .eq("slug", slug)
        .eq("active", true)
        .single();

      if (data) {
        setProduct(data as Product);
        addToRecentlyViewed(data.id);

        // Consent-gated ViewContent — no-op on iOS WKWebView (Apple 5.1.2)
        trackEvent("ViewContent", {
          content_ids: [data.id],
          content_id: data.id,
          content_name: data.name,
          value: data.price,
          currency: "USD",
          content_type: "product",
        });
        // Fetch related
        const { data: rel } = await supabase
          .from("products")
          .select("*, category:categories(id,name,slug)")
          .eq("category_id", data.category_id)
          .eq("active", true)
          .neq("id", data.id)
          .limit(4);
        setRelated((rel as Product[]) || []);
        // Fetch approved reviews
        const { data: revs } = await supabase
          .from("reviews")
          .select("*, user_profiles(first_name, last_name)")
          .eq("product_id", data.id)
          .eq("approved", true)
          .order("created_at", { ascending: false });
        setReviews((revs as Review[]) || []);
        // Fetch rating breakdown
        try {
          const statsRes = await fetch(`/api/reviews/stats?product_id=${data.id}`);
          if (statsRes.ok) {
            const statsJson = await statsRes.json();
            if (statsJson.stats) {
              setRatingBreakdown(statsJson.stats.breakdown || {});
              setAvgRating(statsJson.stats.avg_rating || 0);
            }
          }
        } catch { /* ignore */ }
        // Check wishlist state
        if (user) {
          const { data: wl } = await supabase
            .from("wishlists")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", data.id)
            .maybeSingle();
          setWished(!!wl);
          // Check if user already reviewed
          const { data: myReview } = await supabase
            .from("reviews")
            .select("id")
            .eq("product_id", data.id)
            .eq("user_id", user.id)
            .maybeSingle();
          setHasReviewed(!!myReview);
        } else {
          setWished(isInGuestWishlist(data.id));
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug, user]);

  // Close lightbox / size guide on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setLightboxOpen(false); setSizeGuideOpen(false); }
    }
    if (lightboxOpen || sizeGuideOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, sizeGuideOpen]);

  function handleAddToCart() {
    if (!product) return;

    // Build selected variant string (e.g. "Color: Gold, Size: M")
    const variantEntries = Object.entries(selectedVariants)
      .filter(([, val]) => val)
      .map(([key, val]) => `${key}: ${val}`);
    const selectedVariantStr = variantEntries.length > 0 ? variantEntries.join(", ") : undefined;

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      slug: product.slug,
      quantity,
      selectedVariant: selectedVariantStr,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  async function handleWish() {
    if (!product || wishLoading) return;
    setWishLoading(true);
    if (user) {
      const supabase = createClient();
      if (wished) {
        await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
        setWished(false);
      } else {
        await supabase.from("wishlists").upsert({ user_id: user.id, product_id: product.id });
        setWished(true);
      }
    } else {
      const nowIn = toggleGuestWishlist(product.id);
      setWished(nowIn);
    }
    setWishLoading(false);
  }

  function handleReviewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setReviewImages(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setReviewImagePreviews(previews);
  }

  function removeReviewImage(idx: number) {
    setReviewImages(prev => prev.filter((_, i) => i !== idx));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !user) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      // Upload images first if any
      let uploadedImageUrls: string[] = [];
      if (reviewImages.length > 0) {
        setReviewImageUploading(true);
        const formData = new FormData();
        reviewImages.forEach(f => formData.append("images", f));
        const uploadRes = await fetch("/api/reviews/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        uploadedImageUrls = uploadData.urls || [];
        setReviewImageUploading(false);
      }
      const supabase = createClient();
      const { error } = await supabase.from("reviews").insert({
        product_id: product.id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title || null,
        body: reviewForm.body,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      });
      if (error) {
        setReviewError(error.message.includes("unique") ? "You have already reviewed this product." : "Failed to submit review. Please try again.");
      } else {
        setReviewSuccess(true);
        setHasReviewed(true);
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    }
    setReviewSubmitting(false);
    setReviewImageUploading(false);
  }

  if (loading) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}>
            <div className="shimmer-box" style={{ aspectRatio: "1", borderRadius: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-box" style={{ height: i === 0 ? "40px" : "20px", borderRadius: "8px", width: i === 2 ? "40%" : "100%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "4rem" }}>💎</p>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.5rem", margin: "1rem 0" }}>Product Not Found</h2>
          <Link href="/shop" className="btn-gold">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [""];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/shop" style={{ color: "var(--muted)", textDecoration: "none" }}>Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${product.category.slug}`} style={{ color: "var(--muted)", textDecoration: "none" }}>
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: "var(--gold)" }}>{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", alignItems: "start" }}>
          {/* Images */}
          <div>
            {/* Main Image */}
            <div
              onClick={() => images[activeImage] && setLightboxOpen(true)}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "16px",
                overflow: "hidden",
                background: "var(--surface)",
                border: "1px solid var(--gold-border)",
                marginBottom: "1rem",
                cursor: images[activeImage] ? "zoom-in" : "default",
              }}
            >
              {images[activeImage] ? (
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>
                  💎
                </div>
              )}

              {/* Nav Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                    style={{
                      position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)",
                      border: "1px solid var(--gold-border)", cursor: "pointer",
                      color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImage((activeImage + 1) % images.length)}
                    style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "rgba(10,10,10,0.7)", backdropFilter: "blur(8px)",
                      border: "1px solid var(--gold-border)", cursor: "pointer",
                      color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden",
                      border: `2px solid ${activeImage === i ? "var(--gold)" : "rgba(201,168,76,0.15)"}`,
                      cursor: "pointer", padding: 0, background: "var(--surface)",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {img && <Image src={img} alt="" width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Category & badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {product.category && (
                <Link href={`/shop?category=${product.category.slug}`} className="badge-gold" style={{ textDecoration: "none" }}>
                  {product.category.name}
                </Link>
              )}
              {product.featured && (
                <span className="badge-gold">Featured</span>
              )}
              {hasDiscount && (
                <span style={{ padding: "0.2rem 0.75rem", background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {discountPct}% Off
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", fontWeight: 700, color: "var(--gold)" }}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: "1.1rem", color: "var(--subtle)", textDecoration: "line-through" }}>
                  {formatPrice(product.compare_price!)}
                </span>
              )}
            </div>

            {/* Live viewers */}
            <ViewingNow productId={product.id} />

            {/* Description */}
            {product.description && (
              <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div>
              {product.stock_quantity > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.875rem" }}>
                  <Check size={16} />
                  {product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left in stock` : "In Stock"}
                </div>
              ) : (
                <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>Out of Stock</p>
              )}
            </div>

            {/* Quantity */}
            {product.stock_quantity > 0 && (
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                  Quantity
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: "40px", height: "40px", border: "1px solid var(--gold-border)", borderRight: "none",
                      borderRadius: "4px 0 0 4px", background: "var(--elevated)", color: "var(--gold)",
                      cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    width: "50px", height: "40px", border: "1px solid var(--gold-border)",
                    background: "var(--elevated)", color: "var(--text)", fontSize: "0.875rem",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600,
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    style={{
                      width: "40px", height: "40px", border: "1px solid var(--gold-border)", borderLeft: "none",
                      borderRadius: "0 4px 4px 0", background: "var(--elevated)", color: "var(--gold)",
                      cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Variant Selectors */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {product.variants.map((variant) => (
                  <div key={variant.name}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                      {variant.name}
                      {selectedVariants[variant.name] && (
                        <span style={{ color: "var(--gold)", marginLeft: "0.5rem", textTransform: "none", fontWeight: 500 }}>
                          {selectedVariants[variant.name]}
                        </span>
                      )}
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {variant.options.map((option) => {
                        const isSelected = selectedVariants[variant.name] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [variant.name]: option }))}
                            style={{
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              border: `1px solid ${isSelected ? "var(--gold)" : "rgba(201,168,76,0.2)"}`,
                              background: isSelected ? "var(--gold-muted)" : "var(--elevated)",
                              color: isSelected ? "var(--gold)" : "var(--muted)",
                              fontSize: "0.8rem",
                              fontWeight: isSelected ? 600 : 400,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {product.stock_quantity === 0 ? (
                <BackInStockButton
                  productId={product.id}
                  productName={product.name}
                  variant="button"
                />
              ) : (
                <button
                  ref={addToCartBtnRef}
                  onClick={handleAddToCart}
                  className="btn-gold"
                  style={{ flex: 1, justifyContent: "center", minWidth: "140px" }}
                >
                  <ShoppingBag size={16} />
                  {added ? "Added to Cart!" : "Add to Cart"}
                </button>
              )}
              <button
                onClick={handleWish}
                disabled={wishLoading}
                style={{
                  width: "44px", height: "44px", border: "1px solid var(--gold-border)",
                  borderRadius: "4px", background: wished ? "var(--gold-muted)" : "var(--elevated)",
                  cursor: wishLoading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: wished ? "#ef4444" : "var(--muted)", transition: "all 0.2s", flexShrink: 0,
                }}
                title={wished ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={17} style={{ fill: wished ? "#ef4444" : "none" }} />
              </button>
              <button
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
                style={{
                  width: "44px", height: "44px", border: "1px solid var(--gold-border)",
                  borderRadius: "4px", background: "var(--elevated)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", transition: "all 0.2s", flexShrink: 0,
                }}
              >
                <Share2 size={17} />
              </button>
            </div>

            {/* Trust Badges */}
            <div
              style={{
                display: "flex", flexDirection: "column", gap: "0.75rem",
                padding: "1.25rem", background: "var(--surface)",
                border: "1px solid var(--gold-border)", borderRadius: "10px",
              }}
            >
              {[
                { icon: <Truck size={15} />, text: "Free shipping on orders over $75" },
                { icon: <Shield size={15} />, text: "Secure payment via Stripe" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ color: "var(--gold)" }}>{item.icon}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{item.text}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "var(--gold)" }}><MessageCircle size={15} /></span>
                <Link href="/contact" style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none" }}>
                  Questions? Contact us
                </Link>
              </div>
            {/* Size Guide */}
            {["dresses", "bangles-bracelets"].includes(product.category?.slug ?? "") && (
              <button
                onClick={() => setSizeGuideOpen(true)}
                style={{
                  background: "none",
                  border: "1px solid var(--gold-border)",
                  borderRadius: "8px",
                  padding: "0.6rem 1rem",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "border-color 0.2s, color 0.2s",
                  width: "fit-content",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; }}
              >
                <Ruler size={14} style={{ color: "var(--gold)" }} />
                Size Guide
              </button>
            )}
            </div>

            {/* WhatsApp — Chat about this product */}
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I'm interested in "${product.name}" — https://shopkrisha.com/shop/${slug}`)}`}
                suppressHydrationWarning
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("WhatsAppClick", { location: "product_page", product: product.name });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.7rem 1rem",
                  background: "rgba(37,211,102,0.06)",
                  border: "1px solid rgba(37,211,102,0.25)",
                  borderRadius: "8px",
                  color: "#25D366",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,0.06)"; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat about this product
              </a>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: "5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>
                You May Also Like
              </h2>
              <div className="gold-divider" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div style={{ marginTop: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>
              Customer Reviews
            </h2>
            <div className="gold-divider" />
            {reviews.length > 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {reviews.length} review{reviews.length !== 1 ? "s" : ""} · {" "}
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5 ⭐
                </span>
              </p>
            )}
          </div>

          {/* Rating Breakdown Bars */}
          {reviews.length > 0 && (
            <div className="rating-breakdown" style={{ marginBottom: "2.5rem" }}>
              {/* Left: Big average */}
              <div style={{ textAlign: "center", minWidth: "120px" }}>
                <p style={{ fontSize: "3rem", fontWeight: 700, color: "var(--gold)", lineHeight: 1, margin: 0, fontFamily: "var(--font-playfair)" }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "2px", margin: "0.5rem 0 0.25rem" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} style={{
                      color: s <= Math.round(avgRating || (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)) ? "var(--gold)" : "var(--subtle)",
                      fill: s <= Math.round(avgRating || (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)) ? "var(--gold)" : "none",
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>
              {/* Right: Bars */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star] || reviews.filter((r) => r.rating === star).length;
                  const total = reviews.length;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", minWidth: "1.25rem", textAlign: "right" }}>{star}</span>
                      <Star size={12} style={{ color: "var(--gold)", fill: "var(--gold)", flexShrink: 0 }} />
                      <div style={{ flex: 1, height: "8px", background: "var(--elevated)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--gold), #e8c96a)",
                          borderRadius: "4px",
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--subtle)", minWidth: "2rem", textAlign: "right" }}>
                        {pct > 0 ? `${Math.round(pct)}%` : "0%"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", alignItems: "start" }}>
            {/* Reviews list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem", background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✨</p>
                  <p style={{ color: "var(--muted)" }}>Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.25rem" }}>
                          {review.user_profiles?.first_name
                            ? `${review.user_profiles.first_name} ${review.user_profiles.last_name || ""}`.trim()
                            : "Verified Buyer"}
                        </p>
                        <div className="star-rating">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} size={13} className={s <= review.rating ? "star-filled" : "star-empty"} />
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.72rem", color: "var(--subtle)", margin: 0 }} suppressHydrationWarning>
                          {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        </p>
                        {review.verified_purchase && (
                          <span style={{ fontSize: "0.65rem", color: "#10b981", fontWeight: 600 }}>✓ Verified</span>
                        )}
                      </div>
                    </div>
                    {review.title && <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.35rem" }}>{review.title}</p>}
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{review.body}</p>
                    {review.images && review.images.length > 0 && review.photo_approved !== false && (
                      <ReviewImageLightbox images={review.images} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Write a review */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", padding: "1.5rem", position: "sticky", top: "5rem" }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, color: "var(--gold)", marginBottom: "1.25rem" }}>
                Write a Review
              </h3>

              {!user ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>Sign in to leave a review</p>
                  <Link href="/auth/login" className="btn-gold" style={{ fontSize: "0.85rem" }}>Sign In</Link>
                </div>
              ) : hasReviewed || reviewSuccess ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</p>
                  <p style={{ color: "#10b981", fontWeight: 600, fontSize: "0.875rem" }}>Thank you for your review!</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>It will appear once approved.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Star rating picker */}
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                      Rating *
                    </label>
                    <div className="star-rating" style={{ gap: "0.25rem" }}>
                      {[1,2,3,4,5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                          className={`star-btn ${s <= reviewForm.rating ? "star-filled" : "star-empty"}`}
                        >
                          <Star size={22} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                      Title
                    </label>
                    <input
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Summarize your review"
                      className="input-dark"
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                      Review *
                    </label>
                    <textarea
                      value={reviewForm.body}
                      onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                      required
                      placeholder="Share your experience with this product..."
                      rows={4}
                      className="input-dark"
                      style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--elevated)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "6px", color: "var(--text)", fontSize: "0.875rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </div>
                  {/* Photo Upload */}
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: "0.5rem" }}>
                      Photos (optional, up to 3)
                    </label>
                    {reviewImagePreviews.length > 0 && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        {reviewImagePreviews.map((url, i) => (
                          <div key={i} style={{ position: "relative", width: "72px", height: "72px" }}>
                            <Image src={url} alt={`Preview ${i + 1}`} width={72} height={72} style={{ borderRadius: "8px", objectFit: "cover", border: "1px solid var(--gold-border)", width: "72px", height: "72px" }} />
                            <button
                              type="button"
                              onClick={() => removeReviewImage(i)}
                              style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", padding: 0 }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {reviewImagePreviews.length < 3 && (
                          <label style={{ width: "72px", height: "72px", borderRadius: "8px", border: "2px dashed var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            <Camera size={18} style={{ color: "var(--muted)" }} />
                            <input type="file" accept="image/*" multiple onChange={handleReviewImageChange} style={{ display: "none" }} />
                          </label>
                        )}
                      </div>
                    )}
                    {reviewImagePreviews.length === 0 && (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px dashed var(--gold-border)", cursor: "pointer", color: "var(--muted)", fontSize: "0.8rem" }}>
                        <Camera size={14} />
                        Add Photos
                        <input type="file" accept="image/*" multiple onChange={handleReviewImageChange} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                  {reviewError && (
                    <p style={{ color: "#ef4444", fontSize: "0.8rem", padding: "0.5rem 0.75rem", background: "rgba(239,68,68,0.08)", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>
                      {reviewError}
                    </p>
                  )}
                  <button type="submit" disabled={reviewSubmitting || reviewImageUploading} className="btn-gold" style={{ justifyContent: "center" }}>
                    {reviewImageUploading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Uploading photos...</> : reviewSubmitting ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Send size={15} /> Submit Review</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Lightbox ──────────────────────────────────── */}
      {lightboxOpen && images[activeImage] && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "min(90vw, 720px)", width: "100%" }}
          >
            <Image
              src={images[activeImage]}
              alt={product?.name ?? ""}
              width={900}
              height={900}
              style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}
            />
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute", top: "-14px", right: "-14px",
                width: "36px", height: "36px", borderRadius: "50%",
                background: "var(--surface)", border: "1px solid var(--gold-border)",
                cursor: "pointer", color: "var(--gold)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
          {/* Prev/Next in lightbox */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage - 1 + images.length) % images.length); }}
                style={{ position: "fixed", left: "1rem", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(10,10,10,0.8)", border: "1px solid var(--gold-border)", cursor: "pointer", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage + 1) % images.length); }}
                style={{ position: "fixed", right: "1rem", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(10,10,10,0.8)", border: "1px solid var(--gold-border)", cursor: "pointer", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Size Guide Modal ────────────────────────────────── */}
      {sizeGuideOpen && product && (
        <div
          onClick={() => setSizeGuideOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)", border: "1px solid var(--gold-border)",
              borderRadius: "16px", padding: "2rem", maxWidth: "560px", width: "100%",
              position: "relative", maxHeight: "85vh", overflowY: "auto",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSizeGuideOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Ruler size={20} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Size Guide</h2>
            </div>

            {product.category?.slug === "dresses" ? (
              <>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  Measurements are in inches. For best fit, measure over light clothing.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table" style={{ minWidth: "380px" }}>
                    <thead>
                      <tr>
                        <th>Size</th><th>US Size</th><th>Bust</th><th>Waist</th><th>Hips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "XS", us: "0–2",   bust: "32–33", waist: "25–26", hips: "35–36" },
                        { size: "S",  us: "4–6",   bust: "34–35", waist: "27–28", hips: "37–38" },
                        { size: "M",  us: "8–10",  bust: "36–37", waist: "29–30", hips: "39–40" },
                        { size: "L",  us: "12–14", bust: "38–40", waist: "31–33", hips: "41–43" },
                        { size: "XL", us: "16–18", bust: "41–43", waist: "34–36", hips: "44–46" },
                      ].map((row) => (
                        <tr key={row.size}>
                          <td style={{ fontWeight: 600, color: "var(--gold)" }}>{row.size}</td>
                          <td>{row.us}</td>
                          <td>{row.bust}&quot;</td>
                          <td>{row.waist}&quot;</td>
                          <td>{row.hips}&quot;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
                  * If you&apos;re between sizes, we recommend sizing up for comfort.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  Measure around the widest part of your hand (near your knuckles, excluding your thumb).
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table" style={{ minWidth: "300px" }}>
                    <thead>
                      <tr>
                        <th>Size</th><th>Diameter</th><th>Wrist / Hand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "XS", diameter: "56 mm", fits: "Up to 6\"" },
                        { size: "S",  diameter: "58 mm", fits: "6\" – 6.5\"" },
                        { size: "M",  diameter: "60 mm", fits: "6.5\" – 7\"" },
                        { size: "L",  diameter: "62 mm", fits: "7\" – 7.5\"" },
                        { size: "XL", diameter: "64 mm", fits: "7.5\" – 8\"" },
                      ].map((row) => (
                        <tr key={row.size}>
                          <td style={{ fontWeight: 600, color: "var(--gold)" }}>{row.size}</td>
                          <td>{row.diameter}</td>
                          <td>{row.fits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "1rem" }}>
                  * Traditional bangles are rigid — choose based on your hand measurement, not wrist.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* F6: AI Style Recommender — "You May Also Love" */}
      <ProductRecommendations productId={product.id} />

      {/* Recently Viewed */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        <RecentlyViewed excludeId={product.id} />
      </div>

      {/* Sticky Mobile Add to Cart */}
      <StickyMobileCart
        productId={product.id}
        productName={product.name}
        productPrice={product.price}
        productImage={product.images?.[0] || ""}
        productSlug={product.slug}
        inStock={product.stock_quantity > 0}
        addToCartRef={addToCartBtnRef}
      />

      {/* F11: "Ask a Question" floating button for Crisp live chat */}
      <button
        onClick={() => openCrisp()}
        style={{
          position: "fixed",
          bottom: "140px",
          right: "1.5rem",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.55rem 1rem",
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderRadius: "9999px",
          color: "var(--gold)",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          whiteSpace: "nowrap",
        }}
      >
        💬 Ask a Question
      </button>
    </div>
  );
}
