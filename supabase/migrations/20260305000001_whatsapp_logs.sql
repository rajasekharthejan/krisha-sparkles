-- WhatsApp Message Logs — mirrors email_logs structure
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  to_phone text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent',
  error text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  wa_message_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS whatsapp_logs_created_at_idx ON whatsapp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_logs_status_idx ON whatsapp_logs(status);
