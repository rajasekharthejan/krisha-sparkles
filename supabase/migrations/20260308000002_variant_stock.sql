-- Per-variant stock tracking
-- variant_stock stores a JSONB map of variant-key → quantity
-- e.g. {"40": 1, "44": 1}  (single Size dimension)
-- e.g. {"40-Red": 1, "44-Blue": 0}  (two dimensions, Size × Color)
-- Key is built from product.variants[].options joined by "-" in variant order.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}';

-- Index for JSONB lookups
CREATE INDEX IF NOT EXISTS idx_products_variant_stock
  ON products USING gin(variant_stock);
