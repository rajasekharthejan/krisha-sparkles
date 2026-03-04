-- Payment mode setting: "test" or "live" for Stripe & Shippo key switching.
-- Defaults to "test" for safety — admin must explicitly switch to live in settings.
INSERT INTO store_settings (key, value, description)
VALUES ('payment_mode', 'test', 'Active payment mode: test or live (Stripe + Shippo)')
ON CONFLICT (key) DO NOTHING;
