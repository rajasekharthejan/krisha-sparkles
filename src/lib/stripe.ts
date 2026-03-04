import Stripe from "stripe";
import { getStripeSecretKey } from "./paymentMode";

/**
 * Mode-aware Stripe factory.
 * Creates a fresh Stripe instance using the active mode's secret key.
 * The Stripe constructor is lightweight (no network call) so this is fine
 * to call per-request. The underlying getPaymentMode() is cached per-request
 * via React cache() so only one DB read happens.
 */
export async function getStripe(): Promise<Stripe> {
  const key = await getStripeSecretKey();
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
    httpClient: Stripe.createNodeHttpClient(),
  });
}
