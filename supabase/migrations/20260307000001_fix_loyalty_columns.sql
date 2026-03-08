-- Fix: loyalty_tier, lifetime_points, birthday, tier_upgraded_at
-- were not applied to production in 20260306000005.
-- Using IF NOT EXISTS so safe to run multiple times.

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lifetime_points integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier_upgraded_at timestamptz;

-- Backfill lifetime_points from existing paid/shipped/delivered orders
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id, SUM(FLOOR(total))::integer AS total_pts
    FROM orders
    WHERE user_id IS NOT NULL
      AND status IN ('paid', 'shipped', 'delivered')
    GROUP BY user_id
  LOOP
    UPDATE user_profiles
    SET lifetime_points = COALESCE(lifetime_points, 0) + r.total_pts
    WHERE id = r.user_id AND COALESCE(lifetime_points, 0) = 0;
  END LOOP;
END $$;

-- Set tiers based on lifetime_points
UPDATE user_profiles SET loyalty_tier = 'diamond' WHERE COALESCE(lifetime_points,0) >= 5000;
UPDATE user_profiles SET loyalty_tier = 'gold'    WHERE COALESCE(lifetime_points,0) >= 2000 AND COALESCE(lifetime_points,0) < 5000;
UPDATE user_profiles SET loyalty_tier = 'silver'  WHERE COALESCE(lifetime_points,0) >= 500  AND COALESCE(lifetime_points,0) < 2000;
