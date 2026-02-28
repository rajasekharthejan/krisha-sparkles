-- Phase 7 F3-F11 Database Migrations
-- Run this in Supabase SQL Editor at: https://supabase.com/dashboard/project/hdymmnygwwhszafymdvc/sql/new

-- ============================================================
-- F3: Email Marketing Campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  segment text DEFAULT 'all',
  recipient_count integer DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'admin'
);

-- ============================================================
-- F5: Bundle Builder
-- ============================================================
CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image text,
  bundle_price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_bundles' AND policyname='Public read active bundles') THEN
    CREATE POLICY "Public read active bundles" ON product_bundles FOR SELECT USING (active = true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  UNIQUE(bundle_id, product_id)
);
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bundle_items' AND policyname='Public read bundle items') THEN
    CREATE POLICY "Public read bundle items" ON bundle_items FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- F7: Flash Sale Engine - extended coupon columns
-- ============================================================
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'all';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to_ids text[] DEFAULT '{}';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount numeric(10,2) DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount_amount numeric(10,2);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS auto_apply boolean DEFAULT false;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_banner boolean DEFAULT true;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS banner_text text;

-- ============================================================
-- F8: Analytics Helper Functions
-- ============================================================
CREATE OR REPLACE FUNCTION get_revenue_by_day(days_back integer DEFAULT 30)
RETURNS TABLE(date date, revenue numeric, orders bigint)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(created_at) as date,
    SUM(total) as revenue,
    COUNT(*) as orders
  FROM orders
  WHERE status != 'cancelled'
    AND created_at >= now() - (days_back || ' days')::interval
  GROUP BY DATE(created_at)
  ORDER BY date;
END;
$$;

CREATE OR REPLACE FUNCTION get_top_products(limit_n integer DEFAULT 10)
RETURNS TABLE(product_name text, total_sold bigint, revenue numeric)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT oi.product_name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.quantity * oi.price) as revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status != 'cancelled'
  GROUP BY oi.product_name
  ORDER BY total_sold DESC
  LIMIT limit_n;
END;
$$;

CREATE OR REPLACE FUNCTION get_customer_stats()
RETURNS TABLE(total_customers bigint, repeat_customers bigint, avg_order_value numeric)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT email) as total_customers,
    COUNT(DISTINCT CASE WHEN order_count > 1 THEN email END) as repeat_customers,
    AVG(total) as avg_order_value
  FROM (
    SELECT email, COUNT(*) as order_count, AVG(total) as total
    FROM orders WHERE status != 'cancelled'
    GROUP BY email
  ) sub;
END;
$$;

-- ============================================================
-- F10: TikTok Posts
-- ============================================================
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  thumbnail_url text NOT NULL,
  caption text,
  views_count integer DEFAULT 0,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tiktok_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tiktok_posts' AND policyname='Public read active tiktok posts') THEN
    CREATE POLICY "Public read active tiktok posts" ON tiktok_posts FOR SELECT USING (active = true);
  END IF;
END $$;

-- ============================================================
-- F9: Push Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='Users manage own push subs') THEN
    CREATE POLICY "Users manage own push subs" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
