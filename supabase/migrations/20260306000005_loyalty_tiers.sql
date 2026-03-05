-- ============================================================
-- Phase 8 Feature 1: Loyalty Tiers (Bronze → Silver → Gold → Diamond)
-- ============================================================
-- Adds tier tracking, lifetime points, and birthday to user_profiles.
-- Tiers are determined by lifetime_points (cumulative, never decreases).
--
-- Thresholds:
--   Bronze:  0 – 499
--   Silver:  500 – 1,999
--   Gold:    2,000 – 4,999
--   Diamond: 5,000+

-- 1. Add new columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS loyalty_tier text DEFAULT 'bronze';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lifetime_points integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier_upgraded_at timestamptz;

-- 2. Backfill lifetime_points from existing paid orders
-- Each paid order earns Math.floor(total) lifetime points
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
    SET lifetime_points = r.total_pts
    WHERE id = r.user_id;
  END LOOP;
END $$;

-- 3. Update tiers based on backfilled lifetime_points
UPDATE user_profiles SET loyalty_tier = 'silver' WHERE lifetime_points >= 500 AND (loyalty_tier IS NULL OR loyalty_tier = 'bronze');
UPDATE user_profiles SET loyalty_tier = 'gold' WHERE lifetime_points >= 2000 AND loyalty_tier IN ('bronze', 'silver');
UPDATE user_profiles SET loyalty_tier = 'diamond' WHERE lifetime_points >= 5000 AND loyalty_tier IN ('bronze', 'silver', 'gold');

-- 4. Function to recalculate tier after lifetime_points change
-- Returns new tier name. Updates user_profiles if tier changed.
CREATE OR REPLACE FUNCTION recalculate_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lifetime integer;
  v_old_tier text;
  v_new_tier text;
BEGIN
  SELECT COALESCE(lifetime_points, 0), COALESCE(loyalty_tier, 'bronze')
  INTO v_lifetime, v_old_tier
  FROM user_profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'bronze';
  END IF;

  v_new_tier := CASE
    WHEN v_lifetime >= 5000 THEN 'diamond'
    WHEN v_lifetime >= 2000 THEN 'gold'
    WHEN v_lifetime >= 500 THEN 'silver'
    ELSE 'bronze'
  END;

  IF v_new_tier != v_old_tier THEN
    UPDATE user_profiles
    SET loyalty_tier = v_new_tier, tier_upgraded_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN v_new_tier;
END;
$$;

-- 5. Function to increment lifetime_points + recalculate tier
-- Called from webhook after earning points. Returns new tier.
CREATE OR REPLACE FUNCTION increment_lifetime_points(p_user_id uuid, p_pts integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_tier text;
BEGIN
  UPDATE user_profiles
  SET lifetime_points = COALESCE(lifetime_points, 0) + p_pts
  WHERE id = p_user_id;

  SELECT recalculate_loyalty_tier(p_user_id) INTO v_new_tier;
  RETURN v_new_tier;
END;
$$;
