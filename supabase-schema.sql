-- ============================================================
-- Krisha Sparkles — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  stock_quantity integer DEFAULT 0,
  featured boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  stripe_payment_intent_id text,
  stripe_session_id text UNIQUE,
  subtotal numeric(10,2) NOT NULL,
  tax numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  shipping_address jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL
);

-- ── Row Level Security ──────────────────────────────────────

-- Products: public can read active products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (active = true);

-- Categories: public can read all
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

-- Orders: no public access (server-side only via service role)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ── Seed Categories ─────────────────────────────────────────
INSERT INTO categories (name, slug, icon) VALUES
  ('Necklaces', 'necklaces', '💎'),
  ('Earrings', 'earrings', '✨'),
  ('Bangles & Bracelets', 'bangles-bracelets', '📿'),
  ('Pendant Sets', 'pendant-sets', '🏅'),
  ('Jadau Jewelry', 'jadau-jewelry', '👑'),
  ('Hair Accessories', 'hair-accessories', '🌺'),
  ('Dresses', 'dresses', '👗')
ON CONFLICT (slug) DO NOTHING;

-- ── Storage Bucket ──────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → Create bucket named "product-images"
-- Set it to PUBLIC
-- Or use this SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);


-- ============================================================
-- PHASE 2 MIGRATION — Customer Auth
-- Run these statements in Supabase SQL Editor after the initial schema
-- ============================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  default_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Link orders to users (nullable = guest checkout still works)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- RLS for orders — users see only their own
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger: auto-create user_profile on new auth user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ──────────────────────────────────────────────────────────────
-- Admin security: login audit log (added 2026-02-26)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address  TEXT NOT NULL,
  email_attempted TEXT NOT NULL DEFAULT '',
  success     BOOLEAN NOT NULL DEFAULT false,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service role can access this table (no anon/user access)
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service role (bypasses RLS) can insert/select
