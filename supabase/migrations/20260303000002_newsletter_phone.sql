-- Add phone number and welcome coupon tracking to newsletter subscribers
-- Phone is used for anti-abuse: one welcome coupon per phone number

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS welcome_coupon_code TEXT;

-- Unique index so the same phone can only appear once
-- (partial — only enforced when phone is not null)
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_phone_unique
  ON newsletter_subscribers(phone)
  WHERE phone IS NOT NULL;
