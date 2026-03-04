-- Hero section configurable settings
-- Admin can choose layout + customize text from /admin/hero

INSERT INTO store_settings (key, value, description) VALUES
  ('hero_layout', 'celestial', 'Hero layout: celestial | split | minimal | diagonal | framed'),
  ('hero_heading', 'Adorned in *Gold*, Crafted with *Love*', 'Hero section heading text (* wraps shimmer words)'),
  ('hero_subtext', 'Discover our exclusive collection of imitation jewelry & ethnic wear — inspired by Indian tradition, designed for the modern woman.', 'Hero section subtext'),
  ('hero_badge', 'Handpicked Imitation Jewelry', 'Badge text above hero heading'),
  ('hero_cta_primary_text', 'Shop Collection', 'Primary CTA button text'),
  ('hero_cta_primary_url', '/shop', 'Primary CTA link URL'),
  ('hero_cta_secondary_text', 'Instagram', 'Secondary CTA button text'),
  ('hero_cta_secondary_url', 'https://www.instagram.com/krisha_sparkles/', 'Secondary CTA link URL')
ON CONFLICT (key) DO NOTHING;
