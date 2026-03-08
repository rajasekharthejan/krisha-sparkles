-- Phase 8 Feature 5: A/B Testing Framework
-- Tables: experiments, experiment_variants, experiment_events
-- RPC: get_experiment_results()

-- ─────────────────────────────────────────────────────────────
-- 1. Experiments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  description      text,
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  target_page      text NOT NULL DEFAULT '/',
  target_component text NOT NULL DEFAULT 'hero_section',
  traffic_pct      integer NOT NULL DEFAULT 100
                     CHECK (traffic_pct >= 0 AND traffic_pct <= 100),
  created_by       text NOT NULL,
  created_at       timestamptz DEFAULT now(),
  started_at       timestamptz,
  ended_at         timestamptz,
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- Public can read active experiments (for client-side bucketing)
CREATE POLICY "public_read_active_experiments" ON experiments
  FOR SELECT USING (status = 'active');

-- ─────────────────────────────────────────────────────────────
-- 2. Experiment Variants
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiment_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id  uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name           text NOT NULL,
  weight         integer NOT NULL DEFAULT 50
                   CHECK (weight >= 0 AND weight <= 100),
  config         jsonb NOT NULL DEFAULT '{}',
  is_control     boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;

-- Public can read variants of active experiments
CREATE POLICY "public_read_variants" ON experiment_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM experiments e
      WHERE e.id = experiment_variants.experiment_id AND e.status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Experiment Events (impressions + conversions)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiment_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id  uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id     uuid NOT NULL REFERENCES experiment_variants(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN ('impression', 'conversion')),
  session_id     text NOT NULL,
  revenue        numeric,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE experiment_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (for tracking)
CREATE POLICY "public_insert_events" ON experiment_events
  FOR INSERT WITH CHECK (true);

-- Create indexes for fast aggregation
CREATE INDEX idx_experiment_events_lookup
  ON experiment_events (experiment_id, event_type);
CREATE INDEX idx_experiment_events_variant
  ON experiment_events (variant_id, event_type);

-- ─────────────────────────────────────────────────────────────
-- 4. RPC: Compute experiment results per variant
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_experiment_results(exp_id uuid)
RETURNS TABLE(
  variant_id uuid,
  variant_name text,
  is_control boolean,
  impressions bigint,
  conversions bigint,
  conversion_rate numeric,
  total_revenue numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS variant_id,
    v.name AS variant_name,
    v.is_control,
    COALESCE(imp.cnt, 0)::bigint AS impressions,
    COALESCE(conv.cnt, 0)::bigint AS conversions,
    CASE
      WHEN COALESCE(imp.cnt, 0) > 0
      THEN ROUND(COALESCE(conv.cnt, 0)::numeric / imp.cnt * 100, 2)
      ELSE 0
    END AS conversion_rate,
    COALESCE(conv.rev, 0)::numeric AS total_revenue
  FROM experiment_variants v
  LEFT JOIN (
    SELECT variant_id AS vid, COUNT(DISTINCT session_id) AS cnt
    FROM experiment_events
    WHERE experiment_id = exp_id AND event_type = 'impression'
    GROUP BY variant_id
  ) imp ON imp.vid = v.id
  LEFT JOIN (
    SELECT variant_id AS vid, COUNT(DISTINCT session_id) AS cnt, COALESCE(SUM(revenue), 0) AS rev
    FROM experiment_events
    WHERE experiment_id = exp_id AND event_type = 'conversion'
    GROUP BY variant_id
  ) conv ON conv.vid = v.id
  WHERE v.experiment_id = exp_id
  ORDER BY v.is_control DESC, v.name;
END;
$$;
