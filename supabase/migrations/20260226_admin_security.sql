-- Admin login audit log
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address  TEXT NOT NULL,
  email_attempted TEXT NOT NULL DEFAULT '',
  success     BOOLEAN NOT NULL DEFAULT false,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service role can access this table (no anon/user access)
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service role (bypasses RLS) can insert/select
