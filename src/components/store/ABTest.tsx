"use client";

/**
 * <ABTest> — Wrapper component for A/B testing
 *
 * Usage:
 *   <ABTest
 *     slug="hero-cta-v1"
 *     variants={{
 *       "Control": <HeroSection ctaText="Shop Now" />,
 *       "Variant A": <HeroSection ctaText="Explore Collection" />,
 *     }}
 *     fallback={<HeroSection ctaText="Shop Now" />}
 *   />
 */

import { ReactNode } from "react";
import { useExperiment } from "@/hooks/useExperiment";

interface ABTestProps {
  slug: string;
  variants: Record<string, ReactNode>;
  fallback?: ReactNode;
}

export default function ABTest({ slug, variants, fallback }: ABTestProps) {
  const { variantName, isLoading } = useExperiment(slug);

  // While loading, show fallback or first variant
  if (isLoading) {
    return <>{fallback || Object.values(variants)[0] || null}</>;
  }

  // If no variant assigned (experiment not found or not in traffic), show fallback
  if (!variantName) {
    return <>{fallback || Object.values(variants)[0] || null}</>;
  }

  // Show the matched variant, or fallback if variant name doesn't match
  const content = variants[variantName];
  return <>{content || fallback || Object.values(variants)[0] || null}</>;
}
