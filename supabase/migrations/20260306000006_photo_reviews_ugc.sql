-- ══════════════════════════════════════════════════════════════════
-- Phase 8 Feature 2: Photo Reviews & UGC Gallery
-- Ensures review_requested column exists + RLS for public review reads
-- ══════════════════════════════════════════════════════════════════

-- Ensure review_requested flag on orders (used by /api/cron/review-requests)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_requested boolean DEFAULT false;

-- Ensure reviews table has RLS enabled with public read for approved reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public read approved reviews') THEN
    CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (approved = true);
  END IF;
END $$;

-- Authenticated users can insert their own reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Users insert own reviews') THEN
    CREATE POLICY "Users insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Users update own reviews') THEN
    CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RPC function for batch review stats (avoids N+1 queries)
CREATE OR REPLACE FUNCTION get_review_stats(p_product_ids uuid[])
RETURNS TABLE (
  product_id uuid,
  review_count bigint,
  avg_rating numeric,
  r5 bigint,
  r4 bigint,
  r3 bigint,
  r2 bigint,
  r1 bigint,
  photo_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    r.product_id,
    COUNT(*)::bigint AS review_count,
    ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
    COUNT(*) FILTER (WHERE r.rating = 5)::bigint AS r5,
    COUNT(*) FILTER (WHERE r.rating = 4)::bigint AS r4,
    COUNT(*) FILTER (WHERE r.rating = 3)::bigint AS r3,
    COUNT(*) FILTER (WHERE r.rating = 2)::bigint AS r2,
    COUNT(*) FILTER (WHERE r.rating = 1)::bigint AS r1,
    COUNT(*) FILTER (WHERE r.images IS NOT NULL AND array_length(r.images, 1) > 0 AND r.photo_approved = true)::bigint AS photo_count
  FROM reviews r
  WHERE r.approved = true
    AND r.product_id = ANY(p_product_ids)
  GROUP BY r.product_id;
$$;
