-- Add videos column to products table for product demo/showcase videos
ALTER TABLE products ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

COMMENT ON COLUMN products.videos IS 'Product showcase videos stored in Supabase Storage. Array of public URLs (.mov, .mp4, .webm).';
