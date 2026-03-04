import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Krisha Sparkles — Exquisite Imitation Jewelry",
  description: "Shop handpicked imitation jewelry and ethnic wear at Krisha Sparkles. Necklaces, earrings, bangles, pendant sets, and Jadau jewelry. Free shipping over $75.",
  openGraph: {
    title: "Krisha Sparkles — Exquisite Imitation Jewelry",
    description: "Shop handpicked imitation jewelry — necklaces, earrings, bangles, Jadau sets. USA. Free shipping over $75.",
    images: [{ url: "https://shopkrisha.com/logo.png", width: 800, height: 800 }],
  },
};
import ProductCard from "@/components/store/ProductCard";
import CategoryGrid from "@/components/store/CategoryGrid";
import NewsletterSection from "@/components/store/NewsletterSection";
import FeaturedSlider from "@/components/store/FeaturedSlider";
import MarqueeTicker from "@/components/store/MarqueeTicker";
import type { Product } from "@/types";
import InstagramFeed from "@/components/store/InstagramFeed";
// import TikTokFeed from "@/components/store/TikTokFeed"; // Hidden for now
import Image from "next/image";
import { ArrowRight, Star, Shield, Truck, MessageCircle, Gift } from "lucide-react";

interface BundlePreview {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  compare_price: number | null;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("featured", true)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);
    return (data as Product[]) || [];
  } catch {
    return [];
  }
}

async function getTopBundles(): Promise<BundlePreview[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bundles")
      .select("id, name, slug, description, image, bundle_price, compare_price")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .limit(3);
    return (data as BundlePreview[]) || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, bundles] = await Promise.all([
    getFeaturedProducts(),
    getTopBundles(),
  ]);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          height: "100vh",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 40%, #1a0f05 0%, #0a0a0a 60%)",
        }}
      >
        {/* Animated Background */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute", top: "15%", left: "8%",
              width: "500px", height: "500px",
              background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "float 7s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute", bottom: "15%", right: "8%",
              width: "350px", height: "350px",
              background: "radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "float 9s ease-in-out infinite",
              animationDelay: "-4s",
            }}
          />
          {/* Gold line grid */}
          <div
            style={{
              position: "absolute", inset: 0,
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Floating particles */}
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${5 + (i * 4) % 90}%`,
                top: `${8 + (i * 7) % 82}%`,
                width: i % 3 === 0 ? "3px" : "2px",
                height: i % 3 === 0 ? "3px" : "2px",
                background: i % 4 === 0 ? "var(--gold-light)" : "var(--gold)",
                borderRadius: "50%",
                opacity: 0.25 + (i % 5) * 0.12,
                animation: `float ${3 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${(i * 0.35) % 4}s`,
                boxShadow: "0 0 6px var(--gold)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            padding: "0 1.5rem",
            maxWidth: "820px",
          }}
        >
          <div
            className="badge-gold"
            style={{
              marginBottom: "1.5rem",
              display: "inline-flex",
              animation: "slideUp 0.6s ease 0.2s both",
            }}
          >
            ✦ Handpicked Imitation Jewelry
          </div>

          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2.75rem, 9vw, 5.5rem)",
              fontWeight: 700,
              lineHeight: 1.08,
              marginBottom: "1.5rem",
              animation: "slideUp 0.7s ease 0.35s both",
            }}
          >
            Adorned in{" "}
            <span className="gold-shimmer-text">Gold</span>,
            <br />
            Crafted with{" "}
            <span className="gold-shimmer-text">Love</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
              color: "var(--muted)",
              maxWidth: "520px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.8,
              animation: "slideUp 0.6s ease 0.55s both",
            }}
          >
            Discover our exclusive collection of imitation jewelry &amp; ethnic wear — inspired by Indian tradition, designed for the modern woman.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              animation: "slideUp 0.6s ease 0.7s both",
            }}
          >
            <Link href="/shop" className="btn-gold" style={{ fontSize: "0.875rem", borderRadius: "6px" }}>
              Shop Collection <ArrowRight size={16} />
            </Link>
            <a
              href="https://www.instagram.com/krisha_sparkles/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-outline"
              style={{ fontSize: "0.875rem", borderRadius: "6px" }}
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute", bottom: "2rem", left: "50%",
            transform: "translateX(-50%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "0.5rem",
            animation: "float 2.5s ease-in-out infinite",
          }}
        >
          <div
            style={{
              width: "1px", height: "50px",
              background: "linear-gradient(to bottom, var(--gold), transparent)",
            }}
          />
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase" }}>
            Scroll
          </span>
        </div>
      </section>

      {/* ── Marquee Ticker ────────────────────────────── */}
      <MarqueeTicker />

      {/* ── Features Strip ────────────────────────────── */}
      <section
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {[
            { icon: <Truck size={20} />, title: "Free Shipping", sub: "On orders over $75" },
            { icon: <MessageCircle size={20} />, title: "Dedicated Support", sub: "We're here via email or chat" },
            { icon: <Shield size={20} />, title: "Secure Checkout", sub: "SSL encrypted payments" },
            { icon: <Star size={20} />, title: "Premium Quality", sub: "Handpicked collections" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                animation: "slideUp 0.5s ease both",
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div
                style={{
                  color: "var(--gold)",
                  flexShrink: 0,
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "var(--gold-muted)",
                  border: "1px solid var(--gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {f.icon}
              </div>
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{f.title}</p>
                <p style={{ fontSize: "0.73rem", color: "var(--muted)" }}>{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", background: "var(--bg)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge-gold">Collections</span>
            <h2
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                marginTop: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              Shop by Category
            </h2>
            <div className="gold-divider" />
            <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
              From timeless necklaces to bridal Jadau — explore every style
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* ── Shop by Occasion ───────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem 4rem", background: "var(--surface)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge-gold">Perfect For Every Event</span>
            <h2
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                marginTop: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              Shop by Occasion
            </h2>
            <div className="gold-divider" />
            <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
              Find the perfect jewelry for every moment
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              { name: "Wedding", icon: "💍", desc: "Bridal & ceremonial sets", gradient: "linear-gradient(135deg, #1a0f05, #2a1a0a)" },
              { name: "Party", icon: "🥂", desc: "Glamorous statement pieces", gradient: "linear-gradient(135deg, #0f0a1a, #1a102a)" },
              { name: "Daily Wear", icon: "☀️", desc: "Elegant everyday jewelry", gradient: "linear-gradient(135deg, #0a1a0f, #0f2a1a)" },
              { name: "Festival", icon: "🪔", desc: "Traditional festive jewelry", gradient: "linear-gradient(135deg, #1a1005, #2a1a08)" },
              { name: "Bridal", icon: "👰", desc: "Complete bridal collections", gradient: "linear-gradient(135deg, #1a0510, #2a0a1a)" },
            ].map((occasion, i) => (
              <Link
                key={occasion.name}
                href={`/shop?occasion=${occasion.name}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="occasion-card"
                  style={{
                    background: occasion.gradient,
                    border: "1px solid var(--gold-border)",
                    borderRadius: "14px",
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    animation: "scaleIn 0.4s ease both",
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>
                    {occasion.icon}
                  </span>
                  <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.35rem" }}>
                    {occasion.name}
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                    {occasion.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem 4rem", background: "var(--surface)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "2.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <span className="badge-gold">Handpicked</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  marginTop: "0.75rem",
                }}
              >
                Featured Collection
              </h2>
              <div className="gold-divider-left" />
            </div>
            <Link
              href="/shop"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--gold)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "gap 0.2s ease",
                padding: "0.5rem 1rem",
                border: "1px solid var(--gold-border)",
                borderRadius: "6px",
              }}
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <FeaturedSlider products={featured} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shimmer-box" style={{ borderRadius: "14px", aspectRatio: "1" }}>
                  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, background: "var(--elevated)" }} />
                    <div style={{ padding: "0.875rem", background: "var(--surface)" }}>
                      <div style={{ height: "10px", background: "var(--elevated)", borderRadius: "4px", marginBottom: "8px", width: "50%" }} />
                      <div style={{ height: "13px", background: "var(--elevated)", borderRadius: "4px", marginBottom: "8px" }} />
                      <div style={{ height: "16px", background: "var(--elevated)", borderRadius: "4px", width: "35%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── New Arrivals Strip ────────────────────────── */}
      <section
        style={{
          background: "var(--bg)",
          padding: "5rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              alignItems: "center",
            }}
            className="instagram-grid"
          >
            <div>
              <span className="badge-gold">Follow Us</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  margin: "1rem 0 0.75rem",
                  lineHeight: 1.2,
                }}
              >
                Discover the<br />
                <span className="gold-shimmer-text">Sparkle</span> on Instagram
              </h2>
              <div className="gold-divider-left" />
              <p style={{ color: "var(--muted)", margin: "1.25rem 0 2rem", lineHeight: 1.8, fontSize: "0.9rem" }}>
                Tag us in your photos wearing Krisha Sparkles jewelry. Follow{" "}
                <span style={{ color: "var(--gold)", fontWeight: 600 }}></span>{" "}
                for daily inspiration, new arrivals &amp; exclusive deals.
              </p>
              {/* Social proof counts */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                <span><span style={{ color: "var(--gold)", fontWeight: 700 }}>2.4K+</span> Followers</span>
                <span><span style={{ color: "var(--gold)", fontWeight: 700 }}>180+</span> Posts</span>
              </div>
              <a
                href="https://www.instagram.com/krisha_sparkles/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ borderRadius: "6px" }}
              >
                Follow on Instagram
              </a>
            </div>

            <InstagramFeed />
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .instagram-grid { grid-template-columns: 1fr !important; }
          }
          .occasion-card:hover {
            transform: translateY(-4px);
            border-color: var(--gold) !important;
            box-shadow: 0 12px 40px rgba(201,168,76,0.15);
          }
          .bundle-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.3);
          }
        `}</style>
      </section>

      {/* ── Gift Sets / Bundles Section ───────────────── */}
      {bundles.length > 0 && (
        <section style={{ padding: "5rem 1.5rem", background: "var(--bg)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span className="badge-gold">Curated Sets</span>
                <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginTop: "0.75rem" }}>
                  Shop Gift Sets
                </h2>
                <div className="gold-divider-left" />
                <p style={{ color: "var(--muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
                  Beautifully curated jewelry bundles — perfect for gifting or treating yourself
                </p>
              </div>
              <Link
                href="/bundles"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--gold)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", transition: "gap 0.2s ease", padding: "0.5rem 1rem", border: "1px solid var(--gold-border)", borderRadius: "6px" }}
              >
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {bundles.map((bundle) => {
                const savings = bundle.compare_price ? bundle.compare_price - bundle.bundle_price : 0;
                return (
                  <Link key={bundle.id} href={`/bundles/${bundle.slug}`} style={{ textDecoration: "none" }}>
                    <div
                      className="bundle-card"
                      style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "16px", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                    >
                      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "radial-gradient(ellipse, rgba(201,168,76,0.12), var(--elevated))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {bundle.image ? (
                          <Image src={bundle.image} alt={bundle.name} fill style={{ objectFit: "cover" }} sizes="320px" />
                        ) : (
                          <Gift size={48} style={{ color: "var(--gold)", opacity: 0.5 }} />
                        )}
                        {savings > 0 && (
                          <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "var(--gold)", color: "#000", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Save ${savings.toFixed(0)}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "1.25rem" }}>
                        <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.4rem" }}>{bundle.name}</h3>
                        {bundle.description && (
                          <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {bundle.description}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem", fontWeight: 700, color: "var(--gold)" }}>
                            ${Number(bundle.bundle_price).toFixed(2)}
                          </span>
                          {bundle.compare_price && (
                            <span style={{ fontSize: "0.85rem", color: "var(--subtle)", textDecoration: "line-through" }}>
                              ${Number(bundle.compare_price).toFixed(2)}
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
        </section>
      )}

      {/* TikTok Feed Section — hidden for now */}

      <NewsletterSection />
    </div>
  );
}
