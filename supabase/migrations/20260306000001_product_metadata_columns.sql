-- Add metadata columns to products table for advanced filtering
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS occasion text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS style text;

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS products_material_idx ON products(material);
CREATE INDEX IF NOT EXISTS products_color_idx ON products(color);
CREATE INDEX IF NOT EXISTS products_occasion_idx ON products(occasion);
CREATE INDEX IF NOT EXISTS products_style_idx ON products(style);
CREATE INDEX IF NOT EXISTS products_tags_idx ON products USING gin(tags);
