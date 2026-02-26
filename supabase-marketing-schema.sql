-- Run this in your Supabase SQL editor (production Supabase Dashboard)
-- Feature 4: Abandoned cart tracking

CREATE TABLE IF NOT EXISTS abandoned_cart_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_snapshot jsonb NOT NULL,
  sent_1hr boolean DEFAULT false,
  sent_24hr boolean DEFAULT false,
  recovered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE abandoned_cart_emails ENABLE ROW LEVEL SECURITY;

-- No public policies — service role only
CREATE INDEX IF NOT EXISTS abandoned_cart_updated_at_idx 
  ON abandoned_cart_emails(updated_at) 
  WHERE recovered = false;

-- ─── Sprint 3: F6 Social Proof + F7 Affiliate Tracking ───────────────────────

-- F6: Social proof RPC
CREATE OR REPLACE FUNCTION get_recent_purchases()
RETURNS TABLE(product_name text, buyer_city text, minutes_ago int)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT oi.product_name::text,
    (o.shipping_address->>'city')::text,
    (EXTRACT(EPOCH FROM (now() - o.created_at)) / 60)::int
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at > now() - interval '24 hours'
    AND o.status != 'cancelled'
  ORDER BY o.created_at DESC LIMIT 20;
END;
$$;

-- F7: Influencer attribution columns on coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS influencer_name text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS campaign text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS utm_medium text;

-- F7: UTM attribution + coupon_code on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
