-- =============================================================================
-- Security Hardening Migration — v7.33
-- =============================================================================

-- 1. Atomic points deduction — prevents race condition with concurrent checkouts
-- Returns TRUE if deduction succeeded, FALSE if insufficient balance.
CREATE OR REPLACE FUNCTION deduct_points_atomic(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET points_balance = points_balance - p_amount
  WHERE id = p_user_id AND points_balance >= p_amount;
  RETURN FOUND;
END;
$$;

-- 2. Atomic coupon increment — prevents race condition with concurrent orders
-- Returns TRUE if increment succeeded, FALSE if max_uses limit reached.
CREATE OR REPLACE FUNCTION increment_coupon_atomic(p_coupon_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET uses_count = uses_count + 1,
      -- Auto-deactivate when max_uses limit is reached
      active = CASE
        WHEN max_uses IS NOT NULL AND uses_count + 1 >= max_uses THEN false
        ELSE active
      END
  WHERE id = p_coupon_id
    AND (max_uses IS NULL OR uses_count < max_uses);
  RETURN FOUND;
END;
$$;

-- 3. Idempotency guard: ensure only one order per Stripe session ID
-- This prevents duplicate orders from webhook retries.
-- Use IF NOT EXISTS to be safe if constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_stripe_session_id_unique'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_stripe_session_id_unique
      UNIQUE (stripe_session_id);
  END IF;
END
$$;
