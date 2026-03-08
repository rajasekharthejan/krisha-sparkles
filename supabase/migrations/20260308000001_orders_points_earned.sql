-- Add points_earned column to orders table.
-- Stores the exact points added to user_profiles.points_balance when order
-- reached "delivered" status. Used to reverse points if the order moves back
-- from "delivered" to any other status (e.g. cancelled, returned).
-- Default 0 — old orders (points awarded at checkout) are unaffected.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;
