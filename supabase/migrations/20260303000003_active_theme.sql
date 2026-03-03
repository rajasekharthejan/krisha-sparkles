-- Add active store theme to store_settings
INSERT INTO store_settings (key, value, description) VALUES
  ('active_theme', 'dark', 'Store front theme: dark | pearl | rose')
ON CONFLICT (key) DO NOTHING;
