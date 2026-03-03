-- Store settings: key-value config for runtime-adjustable values
-- Admins can update these from the /admin/settings page without code deploys

CREATE TABLE IF NOT EXISTS store_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read (checkout page needs it), only service_role writes (admin API)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_settings" ON store_settings FOR SELECT USING (true);

-- Default shipping configuration
INSERT INTO store_settings (key, value, description) VALUES
  ('free_shipping_threshold', '75',    'Min order subtotal (USD) for free standard shipping'),
  ('standard_shipping_rate', '9.99',  'Standard shipping rate in USD (5–10 business days)'),
  ('express_shipping_rate',  '14.99', 'Express shipping rate in USD (2–4 business days)')
ON CONFLICT (key) DO NOTHING;
