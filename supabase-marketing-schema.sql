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
