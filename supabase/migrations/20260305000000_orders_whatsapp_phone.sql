-- Add phone and WhatsApp opt-in columns to orders table.
-- These fields enable customer WhatsApp notifications throughout the order lifecycle.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notify_whatsapp boolean DEFAULT false;

-- Partial index for efficient lookup of WhatsApp-opted-in orders (used by cron jobs)
CREATE INDEX IF NOT EXISTS orders_notify_whatsapp_idx
  ON orders(notify_whatsapp)
  WHERE notify_whatsapp = true;
