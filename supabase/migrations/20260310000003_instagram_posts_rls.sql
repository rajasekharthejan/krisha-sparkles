-- Fix RLS policies for instagram_posts table
-- The table only had a SELECT policy; admin writes were blocked.
-- Admin operations now go through the service-role API route,
-- but we also add explicit policies for completeness.

-- Add INSERT/UPDATE/DELETE policies for service role (used by admin API route)
-- The service role bypasses RLS by default, but these policies ensure
-- that authenticated admins can also manage posts if needed.

-- Allow service role to do everything (already implicit, but explicit for clarity)
DO $$
BEGIN
  -- DROP old-only-select setup if it exists, recreate with full admin access
  -- First ensure the table exists (it may have been created via supabase-marketing-schema.sql)
  CREATE TABLE IF NOT EXISTS instagram_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_url text NOT NULL,
    thumbnail_url text NOT NULL,
    caption text,
    likes_count integer DEFAULT 0,
    display_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );
END $$;

ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read active posts" ON instagram_posts;
DROP POLICY IF EXISTS "Admin can insert posts" ON instagram_posts;
DROP POLICY IF EXISTS "Admin can update posts" ON instagram_posts;
DROP POLICY IF EXISTS "Admin can delete posts" ON instagram_posts;
DROP POLICY IF EXISTS "Service role full access" ON instagram_posts;

-- Public SELECT: anyone can read active posts (for homepage feed)
CREATE POLICY "Public can read active posts"
  ON instagram_posts FOR SELECT
  USING (active = true);

-- Admin SELECT: authenticated admins can read all posts (including inactive)
CREATE POLICY "Admin can read all posts"
  ON instagram_posts FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.jwt() ->> 'email' = 'admin@krishasparkles.com'
  );

-- Admin INSERT
CREATE POLICY "Admin can insert posts"
  ON instagram_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.jwt() ->> 'email' = 'admin@krishasparkles.com'
  );

-- Admin UPDATE
CREATE POLICY "Admin can update posts"
  ON instagram_posts FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.jwt() ->> 'email' = 'admin@krishasparkles.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.jwt() ->> 'email' = 'admin@krishasparkles.com'
  );

-- Admin DELETE
CREATE POLICY "Admin can delete posts"
  ON instagram_posts FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
    OR auth.jwt() ->> 'email' = 'admin@krishasparkles.com'
  );
