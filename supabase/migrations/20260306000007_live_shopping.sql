-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  Phase 8 Feature 3 — Live Shopping                                        ║
-- ║  Tables: live_events, live_event_products, live_event_messages             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── live_events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  video_url   text,
  thumbnail   text,
  status      text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  discount_code  text,
  discount_label text,
  scheduled_at   timestamptz,
  started_at     timestamptz,
  ended_at       timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS: anyone can read, service role can write
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read live_events" ON live_events
  FOR SELECT USING (true);
CREATE POLICY "Service role can manage live_events" ON live_events
  FOR ALL USING (auth.role() = 'service_role');

-- ── live_event_products ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_event_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  special_price numeric(10,2),
  UNIQUE(event_id, product_id)
);

ALTER TABLE live_event_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read live_event_products" ON live_event_products
  FOR SELECT USING (true);
CREATE POLICY "Service role can manage live_event_products" ON live_event_products
  FOR ALL USING (auth.role() = 'service_role');

-- ── live_event_messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_event_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  user_id    uuid,
  user_name  text NOT NULL DEFAULT 'Guest',
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE live_event_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read live_event_messages" ON live_event_messages
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON live_event_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage live_event_messages" ON live_event_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ── Enable Realtime for chat messages ───────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE live_event_messages;
