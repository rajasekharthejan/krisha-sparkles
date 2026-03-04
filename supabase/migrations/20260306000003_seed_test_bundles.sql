-- Seed 5 test bundles with bundle_items referencing test products
-- Uses ON CONFLICT DO NOTHING so this migration is idempotent

-- ══════════════════════════════════════════════════════════════════════════════
-- BUNDLE 1: Bridal Essentials
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO bundles (name, slug, description, image, bundle_price, compare_price, active, display_order)
VALUES (
  'Bridal Essentials',
  'bridal-essentials',
  'Everything you need for your special day — a stunning kundan necklace, matching chandbali earrings, bridal bangles, and a classic maang tikka. Save over $80 when you buy the complete set!',
  'https://picsum.photos/seed/bundle1/800/800',
  199.99,
  280.00,
  true,
  1
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM bundles WHERE slug = 'bridal-essentials'), (SELECT id FROM products WHERE slug = 'royal-kundan-choker'), 1),
((SELECT id FROM bundles WHERE slug = 'bridal-essentials'), (SELECT id FROM products WHERE slug = 'kundan-chandbali-earrings'), 1),
((SELECT id FROM bundles WHERE slug = 'bridal-essentials'), (SELECT id FROM products WHERE slug = 'kundan-bridal-bangles-set'), 1),
((SELECT id FROM bundles WHERE slug = 'bridal-essentials'), (SELECT id FROM products WHERE slug = 'kundan-maang-tikka-classic'), 1)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- BUNDLE 2: Party Night Glam
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO bundles (name, slug, description, image, bundle_price, compare_price, active, display_order)
VALUES (
  'Party Night Glam',
  'party-night-glam',
  'Turn heads at every party with this glamorous set — a crystal statement collar necklace, dazzling chandbali earrings, and a sparkling tennis bracelet. Complete party-ready look!',
  'https://picsum.photos/seed/bundle2/800/800',
  89.99,
  130.00,
  true,
  2
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM bundles WHERE slug = 'party-night-glam'), (SELECT id FROM products WHERE slug = 'crystal-statement-collar'), 1),
((SELECT id FROM bundles WHERE slug = 'party-night-glam'), (SELECT id FROM products WHERE slug = 'statement-tassel-earrings'), 1),
((SELECT id FROM bundles WHERE slug = 'party-night-glam'), (SELECT id FROM products WHERE slug = 'crystal-tennis-bracelet'), 1)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- BUNDLE 3: Daily Wear Basics
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO bundles (name, slug, description, image, bundle_price, compare_price, active, display_order)
VALUES (
  'Daily Wear Basics',
  'daily-wear-basics',
  'Your everyday jewelry essentials — a minimalist pendant, classic diamond-style studs, and a delicate pearl bracelet. Subtle elegance for daily wear. Save 30%!',
  'https://picsum.photos/seed/bundle3/800/800',
  49.99,
  72.00,
  true,
  3
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM bundles WHERE slug = 'daily-wear-basics'), (SELECT id FROM products WHERE slug = 'rose-gold-minimalist-pendant-chain'), 1),
((SELECT id FROM bundles WHERE slug = 'daily-wear-basics'), (SELECT id FROM products WHERE slug = 'diamond-style-stud-earrings'), 1),
((SELECT id FROM bundles WHERE slug = 'daily-wear-basics'), (SELECT id FROM products WHERE slug = 'pearl-string-bracelet'), 1)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- BUNDLE 4: Festive Collection
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO bundles (name, slug, description, image, bundle_price, compare_price, active, display_order)
VALUES (
  'Festive Collection',
  'festive-collection',
  'Celebrate every festival in style with this traditional set — a temple gold necklace, classic gold jhumkas, and vibrant meenakari bangles. Perfect for Diwali, Navratri, and more!',
  'https://picsum.photos/seed/bundle4/800/800',
  129.99,
  185.00,
  true,
  4
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM bundles WHERE slug = 'festive-collection'), (SELECT id FROM products WHERE slug = 'temple-gold-long-necklace'), 1),
((SELECT id FROM bundles WHERE slug = 'festive-collection'), (SELECT id FROM products WHERE slug = 'classic-gold-jhumka-earrings'), 1),
((SELECT id FROM bundles WHERE slug = 'festive-collection'), (SELECT id FROM products WHERE slug = 'meenakari-rajasthani-bangles'), 1)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- BUNDLE 5: Complete Bridal Set (Premium)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO bundles (name, slug, description, image, bundle_price, compare_price, active, display_order)
VALUES (
  'Complete Bridal Set',
  'complete-bridal-set',
  'The ultimate bridal jewelry collection — premium jadau necklace set, jadau chandbali earrings, bridal maang tikka, and kundan bridal bangles. Save over $120 on this luxury set!',
  'https://picsum.photos/seed/bundle5/800/800',
  299.99,
  420.00,
  true,
  5
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM bundles WHERE slug = 'complete-bridal-set'), (SELECT id FROM products WHERE slug = 'jadau-kundan-necklace-set'), 1),
((SELECT id FROM bundles WHERE slug = 'complete-bridal-set'), (SELECT id FROM products WHERE slug = 'jadau-chandbali-earrings'), 1),
((SELECT id FROM bundles WHERE slug = 'complete-bridal-set'), (SELECT id FROM products WHERE slug = 'jadau-maang-tikka'), 1),
((SELECT id FROM bundles WHERE slug = 'complete-bridal-set'), (SELECT id FROM products WHERE slug = 'kundan-bridal-bangles-set'), 1)
ON CONFLICT DO NOTHING;
