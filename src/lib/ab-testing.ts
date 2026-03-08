/**
 * A/B Testing utilities — client-side bucketing + tracking
 *
 * Cookie: `ks_ab_sid` — 90-day UUID session ID for deterministic variant assignment
 * Bucketing: Hash(sessionId + experimentId) mod 100 → variant by weight
 */

import type { Experiment, ExperimentVariant } from "@/types";

const SESSION_COOKIE = "ks_ab_sid";
const COOKIE_DAYS = 90;

// ── Session ID ────────────────────────────────────────────────

/** Get or create a sticky A/B session ID (UUID stored in cookie) */
export function getSessionId(): string {
  if (typeof document === "undefined") return "server";

  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  const sid = crypto.randomUUID();
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=${sid}; path=/; expires=${expires}; SameSite=Lax`;
  return sid;
}

// ── Deterministic Hashing ────────────────────────────────────

/** Simple string hash → number 0-99 (deterministic, consistent) */
export function hashBucket(sessionId: string, experimentId: string): number {
  const str = sessionId + ":" + experimentId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // hash * 31 + char
  }
  return Math.abs(hash) % 100;
}

// ── Variant Assignment ───────────────────────────────────────

/** Assign a variant based on deterministic bucket and weights */
export function assignVariant(
  experiment: Experiment,
  sessionId: string,
): ExperimentVariant | null {
  const variants = experiment.experiment_variants;
  if (!variants || variants.length === 0) return null;

  // Check traffic allocation — if user's bucket >= traffic_pct, not in experiment
  const trafficBucket = hashBucket(sessionId, experiment.id + ":traffic");
  if (trafficBucket >= experiment.traffic_pct) return null;

  // Assign variant by weight
  const bucket = hashBucket(sessionId, experiment.id);
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return variants[0];

  const normalizedBucket = (bucket / 100) * totalWeight;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (normalizedBucket < cumulative) return variant;
  }

  return variants[variants.length - 1]; // fallback
}

// ── Event Tracking ───────────────────────────────────────────

/** Track an impression event */
export async function trackImpression(
  experimentId: string,
  variantId: string,
  sessionId: string,
): Promise<void> {
  try {
    await fetch("/api/experiments/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experiment_id: experimentId,
        variant_id: variantId,
        event_type: "impression",
        session_id: sessionId,
      }),
    });
  } catch {
    // Silently fail — tracking shouldn't block UX
  }
}

/** Track a conversion event */
export async function trackConversion(
  experimentId: string,
  variantId: string,
  sessionId: string,
  revenue?: number,
): Promise<void> {
  try {
    await fetch("/api/experiments/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experiment_id: experimentId,
        variant_id: variantId,
        event_type: "conversion",
        session_id: sessionId,
        revenue,
      }),
    });
  } catch {
    // Silently fail
  }
}
