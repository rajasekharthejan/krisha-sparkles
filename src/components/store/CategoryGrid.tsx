import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CAT_THEMES: Record<string, { bg: string; glow: string }> = {
  necklaces:          { bg: "linear-gradient(145deg,#1a1200,#2a1f00)", glow: "radial-gradient(circle at 50% 60%, rgba(201,168,76,0.35), transparent 70%)" },
  earrings:           { bg: "linear-gradient(145deg,#1a0010,#2a0020)", glow: "radial-gradient(circle at 50% 60%, rgba(255,105,180,0.3), transparent 70%)" },
  "bangles-bracelets":{ bg: "linear-gradient(145deg,#0d0020,#180040)", glow: "radial-gradient(circle at 50% 60%, rgba(147,112,219,0.35), transparent 70%)" },
  "pendant-sets":     { bg: "linear-gradient(145deg,#001a18,#002a26)", glow: "radial-gradient(circle at 50% 60%, rgba(64,224,208,0.3), transparent 70%)" },
  "jadau-jewelry":    { bg: "linear-gradient(145deg,#1a1000,#301c00)", glow: "radial-gradient(circle at 50% 60%, rgba(255,200,50,0.35), transparent 70%)" },
  "hair-accessories": { bg: "linear-gradient(145deg,#001a08,#002a14)", glow: "radial-gradient(circle at 50% 60%, rgba(80,200,120,0.3), transparent 70%)" },
  dresses:            { bg: "linear-gradient(145deg,#1a0800,#2a1000)", glow: "radial-gradient(circle at 50% 60%, rgba(255,130,80,0.3), transparent 70%)" },
};

// Default theme for any future category added via admin
function defaultTheme(idx: number): { bg: string; glow: string } {
  const palette = [
    { bg: "linear-gradient(145deg,#0a1a1a,#102a2a)", glow: "radial-gradient(circle at 50% 60%, rgba(0,200,200,0.3), transparent 70%)" },
    { bg: "linear-gradient(145deg,#1a0a1a,#2a102a)", glow: "radial-gradient(circle at 50% 60%, rgba(200,0,200,0.3), transparent 70%)" },
    { bg: "linear-gradient(145deg,#0a1a0a,#102a10)", glow: "radial-gradient(circle at 50% 60%, rgba(0,200,0,0.3), transparent 70%)" },
  ];
  return palette[idx % palette.length];
}

export default async function CategoryGrid() {
  const supabase = await createClient();

  // Fetch categories ordered by display_order (admin-set)
  const [{ data: cats }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,icon,display_order").order("display_order"),
    supabase.from("products").select("category_id").eq("active", true),
  ]);

  // Count active products per category
  const countMap: Record<string, number> = {};
  for (const p of products || []) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  }

  // Only show categories that have at least 1 active product
  const visible = (cats || []).filter((c) => (countMap[c.id] || 0) > 0);

  if (visible.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: "1rem",
      }}
    >
      {visible.map((cat, i) => {
        const theme = CAT_THEMES[cat.slug] ?? defaultTheme(i);
        return (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="cat-card"
            style={{
              background: theme.bg,
              animationDelay: `${i * 0.07}s`,
            }}
          >
            {/* Glow overlay */}
            <div className="cat-glow" style={{ background: theme.glow }} />

            {/* Top shine line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)",
              }}
            />

            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>

            {/* Bottom bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
                opacity: 0,
                transition: "opacity 0.3s ease",
              }}
              className="cat-bottom-bar"
            />
          </Link>
        );
      })}
    </div>
  );
}
