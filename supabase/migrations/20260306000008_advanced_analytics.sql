-- Phase 8 Feature 4: Advanced Analytics — 4 new RPC functions
-- Provides cohort retention, customer LTV, category revenue, and conversion funnel data.

-- ─────────────────────────────────────────────────────────────
-- 1. Customer Cohorts — group by first-purchase month, track retention
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_customer_cohorts(months_back integer DEFAULT 6)
RETURNS TABLE(
  cohort_month date,
  period_offset integer,
  customer_count bigint,
  total_revenue numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH first_purchases AS (
    SELECT
      o.email,
      DATE_TRUNC('month', MIN(o.created_at))::date AS cohort_month
    FROM orders o
    WHERE o.status != 'cancelled'
      AND o.email IS NOT NULL
    GROUP BY o.email
    HAVING DATE_TRUNC('month', MIN(o.created_at)) >= DATE_TRUNC('month', now()) - (months_back || ' months')::interval
  ),
  cohort_orders AS (
    SELECT
      fp.cohort_month,
      EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', o.created_at), fp.cohort_month))::integer AS period_offset,
      o.email,
      o.total
    FROM first_purchases fp
    JOIN orders o ON o.email = fp.email
    WHERE o.status != 'cancelled'
  )
  SELECT
    co.cohort_month,
    co.period_offset,
    COUNT(DISTINCT co.email)::bigint AS customer_count,
    COALESCE(SUM(co.total), 0)::numeric AS total_revenue
  FROM cohort_orders co
  GROUP BY co.cohort_month, co.period_offset
  ORDER BY co.cohort_month, co.period_offset;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Customer Lifetime Value — per-customer totals
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_customer_ltv()
RETURNS TABLE(
  email text,
  name text,
  total_spent numeric,
  order_count bigint,
  first_purchase timestamptz,
  last_purchase timestamptz,
  avg_order_value numeric
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.email::text,
    MAX(o.name)::text AS name,
    COALESCE(SUM(o.total), 0)::numeric AS total_spent,
    COUNT(*)::bigint AS order_count,
    MIN(o.created_at) AS first_purchase,
    MAX(o.created_at) AS last_purchase,
    COALESCE(AVG(o.total), 0)::numeric AS avg_order_value
  FROM orders o
  WHERE o.status != 'cancelled'
    AND o.email IS NOT NULL
  GROUP BY o.email
  ORDER BY total_spent DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Category Revenue — revenue per product category
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_category_revenue(days_back integer DEFAULT 30)
RETURNS TABLE(
  category_name text,
  category_id uuid,
  total_revenue numeric,
  total_units bigint,
  order_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(c.name, 'Uncategorized')::text AS category_name,
    c.id AS category_id,
    COALESCE(SUM(oi.price * oi.quantity), 0)::numeric AS total_revenue,
    COALESCE(SUM(oi.quantity), 0)::bigint AS total_units,
    COUNT(DISTINCT o.id)::bigint AS order_count
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  LEFT JOIN products p ON p.id = oi.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE o.status != 'cancelled'
    AND o.created_at >= now() - (days_back || ' days')::interval
  GROUP BY c.name, c.id
  ORDER BY total_revenue DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. Conversion Funnel — order-stage counts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_conversion_funnel(days_back integer DEFAULT 30)
RETURNS TABLE(
  step_name text,
  step_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH period_orders AS (
    SELECT * FROM orders
    WHERE created_at >= now() - (days_back || ' days')::interval
  )
  SELECT 'All Orders'::text, COUNT(*)::bigint FROM period_orders
  UNION ALL
  SELECT 'Paid'::text, COUNT(*)::bigint FROM period_orders
    WHERE status IN ('paid', 'shipped', 'label_created', 'in_transit', 'out_for_delivery', 'delivered')
  UNION ALL
  SELECT 'Shipped'::text, COUNT(*)::bigint FROM period_orders
    WHERE status IN ('shipped', 'label_created', 'in_transit', 'out_for_delivery', 'delivered')
  UNION ALL
  SELECT 'Delivered'::text, COUNT(*)::bigint FROM period_orders
    WHERE status = 'delivered'
  UNION ALL
  SELECT 'Repeat Customers'::text, COUNT(*)::bigint FROM (
    SELECT email FROM period_orders
    WHERE status != 'cancelled' AND email IS NOT NULL
    GROUP BY email HAVING COUNT(*) > 1
  ) rc;
END;
$$;
