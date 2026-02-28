CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  resend_id text,
  status text DEFAULT 'sent',
  error text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON email_logs(status);
