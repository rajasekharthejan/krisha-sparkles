-- Phase 8: Virtual Try-On — transparent product images (background removed)
-- Parallel array to `images` — each index maps to the same product image but with background removed.
-- Empty string means that image hasn't been processed yet.

ALTER TABLE products ADD COLUMN IF NOT EXISTS images_no_bg text[] DEFAULT '{}';

COMMENT ON COLUMN products.images_no_bg IS 'Background-removed versions of product images for AR Virtual Try-On. Parallel array to images[].';
