-- F5: Fix bundle tables — agent used 'bundles' table name (not product_bundles)
-- This migration creates proper 'bundles' and cleans up 'bundle_items' FK

-- 1. Create 'bundles' table (if not exists)
CREATE TABLE IF NOT EXISTS bundles (
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
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bundles' AND policyname='Public read active bundles') THEN
    CREATE POLICY "Public read active bundles" ON bundles FOR SELECT USING (active = true);
  END IF;
END $$;

-- 2. Drop old bundle_items if it has wrong FK (references product_bundles)
-- Then recreate it correctly
DO $$ BEGIN
  -- Only drop and recreate if bundle_items references product_bundles
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE 'bundle_items_bundle_id_fkey'
    AND table_name = 'bundle_items'
  ) THEN
    -- Check if the FK points to product_bundles
    IF EXISTS (
      SELECT 1 FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON rc.unique_constraint_name = tc.constraint_name
      WHERE rc.constraint_name = 'bundle_items_bundle_id_fkey'
      AND tc.table_name = 'product_bundles'
    ) THEN
      DROP TABLE IF EXISTS bundle_items CASCADE;
    END IF;
  END IF;
END $$;

-- 3. Recreate bundle_items referencing 'bundles'
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
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
