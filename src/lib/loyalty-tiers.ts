/**
 * Loyalty Tiers Configuration
 *
 * Shared config used by API routes, webhook, checkout, and UI pages.
 * Tiers are determined by lifetime_points (cumulative, never decreases).
 *
 * Tier thresholds:
 *   Bronze:  0 – 499 lifetime pts
 *   Silver:  500 – 1,999 lifetime pts
 *   Gold:    2,000 – 4,999 lifetime pts
 *   Diamond: 5,000+ lifetime pts
 */

export type LoyaltyTierName = "bronze" | "silver" | "gold" | "diamond";

export interface TierConfig {
  name: LoyaltyTierName;
  label: string;
  minPoints: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  pointsMultiplier: number;       // earning multiplier (e.g. 1.5x = earn 50% more)
  freeShippingThreshold: number | null; // null = always free
  birthdayBonus: number;          // bonus points on birthday
  earlyAccess: boolean;           // early access to new drops
  exclusiveDrops: boolean;        // access to exclusive products
  pointsPerDollar: number;        // how many pts = $1 off (lower = better deal)
}

export const LOYALTY_TIERS: Record<LoyaltyTierName, TierConfig> = {
  bronze: {
    name: "bronze",
    label: "Bronze",
    minPoints: 0,
    color: "#cd7f32",
    bgColor: "rgba(205,127,50,0.12)",
    borderColor: "rgba(205,127,50,0.3)",
    icon: "🥉",
    pointsMultiplier: 1,
    freeShippingThreshold: 75,
    birthdayBonus: 0,
    earlyAccess: false,
    exclusiveDrops: false,
    pointsPerDollar: 100,
  },
  silver: {
    name: "silver",
    label: "Silver",
    minPoints: 500,
    color: "#c0c0c0",
    bgColor: "rgba(192,192,192,0.12)",
    borderColor: "rgba(192,192,192,0.3)",
    icon: "🥈",
    pointsMultiplier: 1.25,
    freeShippingThreshold: 50,
    birthdayBonus: 100,
    earlyAccess: false,
    exclusiveDrops: false,
    pointsPerDollar: 100,
  },
  gold: {
    name: "gold",
    label: "Gold",
    minPoints: 2000,
    color: "#c9a84c",
    bgColor: "rgba(201,168,76,0.12)",
    borderColor: "rgba(201,168,76,0.3)",
    icon: "🥇",
    pointsMultiplier: 1.5,
    freeShippingThreshold: 25,
    birthdayBonus: 250,
    earlyAccess: true,
    exclusiveDrops: false,
    pointsPerDollar: 90,
  },
  diamond: {
    name: "diamond",
    label: "Diamond",
    minPoints: 5000,
    color: "#b9f2ff",
    bgColor: "rgba(185,242,255,0.12)",
    borderColor: "rgba(185,242,255,0.3)",
    icon: "💎",
    pointsMultiplier: 2,
    freeShippingThreshold: null,
    birthdayBonus: 500,
    earlyAccess: true,
    exclusiveDrops: true,
    pointsPerDollar: 80,
  },
};

export const TIER_ORDER: LoyaltyTierName[] = ["bronze", "silver", "gold", "diamond"];

/** Get tier config by tier name (defaults to bronze) */
export function getTierConfig(tierName: string): TierConfig {
  return LOYALTY_TIERS[tierName as LoyaltyTierName] || LOYALTY_TIERS.bronze;
}

/** Determine tier from lifetime points */
export function getTierByLifetimePoints(lifetimePoints: number): TierConfig {
  if (lifetimePoints >= 5000) return LOYALTY_TIERS.diamond;
  if (lifetimePoints >= 2000) return LOYALTY_TIERS.gold;
  if (lifetimePoints >= 500) return LOYALTY_TIERS.silver;
  return LOYALTY_TIERS.bronze;
}

/** Get the next tier (null if already Diamond) */
export function getNextTier(currentTier: LoyaltyTierName): TierConfig | null {
  const idx = TIER_ORDER.indexOf(currentTier);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return LOYALTY_TIERS[TIER_ORDER[idx + 1]];
}

/** Calculate progress toward next tier */
export function getProgressToNextTier(
  lifetimePoints: number,
  currentTier: LoyaltyTierName
): { next: TierConfig | null; pointsNeeded: number; progress: number } {
  const next = getNextTier(currentTier);
  if (!next) return { next: null, pointsNeeded: 0, progress: 100 };

  const current = LOYALTY_TIERS[currentTier];
  const range = next.minPoints - current.minPoints;
  const earned = lifetimePoints - current.minPoints;
  const progress = Math.min(100, Math.max(0, (earned / range) * 100));
  const pointsNeeded = Math.max(0, next.minPoints - lifetimePoints);

  return { next, pointsNeeded, progress };
}
