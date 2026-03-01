-- Migration: Users module, Archive Orders, Reset Data support
-- Run in Supabase SQL Editor

-- 1. Add archived column to orders (for Archive All feature)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS orders_archived_idx ON orders(archived);

-- 2. Update orders list view to support archived filter
-- The API already handles this via ?archived=true param

-- 3. Ensure user_profiles has points_balance (in case migration missed it)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS points_balance integer DEFAULT 0;

-- 4. Grant service role access to auth.users (already available via admin API)
-- No SQL needed — handled via supabase.auth.admin.listUsers()

-- 5. reviews table (if not already created via Phase 7)
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating      integer CHECK (rating >= 1 AND rating <= 5),
  title       text,
  body        text,
  approved    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 6. contact_messages table (if not already exists)
CREATE TABLE IF NOT EXISTS contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text,
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- RLS for contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON contact_messages;
CREATE POLICY "Service role full access" ON contact_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can insert contact message" ON contact_messages;
CREATE POLICY "Anyone can insert contact message" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- 7. newsletter_subscribers table (if not already exists from Phase 7)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text UNIQUE NOT NULL,
  active       boolean DEFAULT true,
  source       text DEFAULT 'website',
  subscribed_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access ns" ON newsletter_subscribers;
CREATE POLICY "Service role full access ns" ON newsletter_subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
