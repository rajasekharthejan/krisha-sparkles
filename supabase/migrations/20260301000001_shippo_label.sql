-- Add label_url column to orders for storing Shippo label PDF URLs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text;
