/**
 * Payment Mode Resolver — Test / Live key switching for Stripe & Shippo.
 *
 * The active mode ("test" | "live") is stored in store_settings.
 * API keys live in env vars with _TEST / _LIVE suffixes.
 * Cached per-request via React cache() — one DB read per HTTP request max.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export type PaymentMode = "test" | "live";

/* ── Mode reader (cached per server request) ─────────────────────────── */

export const getPaymentMode = cache(async (): Promise<PaymentMode> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "payment_mode")
      .single();

    const mode = data?.value;
    if (mode === "live" || mode === "test") return mode;
    return "test"; // safe default
  } catch {
    return "test"; // never break the app; test is the safer fallback
  }
});

/* ── Key resolvers ────────────────────────────────────────────────────── */

export async function getStripeSecretKey(): Promise<string> {
  const mode = await getPaymentMode();
  const key =
    mode === "live"
      ? (process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY)
      : (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
  if (!key) throw new Error(`Missing STRIPE_SECRET_KEY_${mode.toUpperCase()}`);
  return key;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const mode = await getPaymentMode();
  const key =
    mode === "live"
      ? (process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET)
      : (process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET);
  if (!key) throw new Error(`Missing STRIPE_WEBHOOK_SECRET_${mode.toUpperCase()}`);
  return key;
}

/** Returns the OTHER mode's webhook secret (for dual-secret fallback). */
export async function getStripeWebhookSecretFallback(): Promise<string | null> {
  const mode = await getPaymentMode();
  const key =
    mode === "live"
      ? (process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET)
      : (process.env.STRIPE_WEBHOOK_SECRET_LIVE || null);
  return key || null;
}

export async function getShippoApiKey(): Promise<string> {
  const mode = await getPaymentMode();
  const key =
    mode === "live"
      ? (process.env.SHIPPO_API_KEY_LIVE || process.env.SHIPPO_API_KEY)
      : (process.env.SHIPPO_API_KEY_TEST || process.env.SHIPPO_API_KEY);
  if (!key) throw new Error(`Missing SHIPPO_API_KEY_${mode.toUpperCase()}`);
  return key;
}

/* ── Env-var status (for admin UI) ────────────────────────────────────── */

export function getEnvStatus() {
  return {
    stripeTest: !!(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY),
    stripeLive: !!process.env.STRIPE_SECRET_KEY_LIVE,
    stripeWebhookTest: !!(process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET),
    stripeWebhookLive: !!process.env.STRIPE_WEBHOOK_SECRET_LIVE,
    shippoTest: !!(process.env.SHIPPO_API_KEY_TEST || process.env.SHIPPO_API_KEY),
    shippoLive: !!process.env.SHIPPO_API_KEY_LIVE,
  };
}
