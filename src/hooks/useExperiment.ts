"use client";

/**
 * useExperiment — React hook for A/B testing
 *
 * Usage:
 *   const { variant, isLoading, trackConversion } = useExperiment("hero-cta-v1");
 *
 * Returns the assigned variant for the current user (sticky via cookie).
 * Fires an impression event once per session per experiment.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Experiment, ExperimentVariant } from "@/types";
import {
  getSessionId,
  assignVariant,
  trackImpression,
  trackConversion as trackConv,
} from "@/lib/ab-testing";

// In-memory cache for active experiments (shared across hook instances)
let cachedExperiments: Experiment[] | null = null;
let fetchPromise: Promise<Experiment[]> | null = null;

async function fetchActiveExperiments(): Promise<Experiment[]> {
  if (cachedExperiments) return cachedExperiments;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/experiments/active")
    .then((r) => r.json())
    .then((data) => {
      cachedExperiments = data.experiments || [];
      return cachedExperiments!;
    })
    .catch(() => {
      cachedExperiments = [];
      return [];
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

// Track which experiments we've already fired impressions for (per page load)
const impressionsFired = new Set<string>();

interface UseExperimentResult {
  variant: ExperimentVariant | null;
  variantName: string | null;
  isLoading: boolean;
  trackConversion: (revenue?: number) => void;
}

export function useExperiment(experimentSlug: string): UseExperimentResult {
  const [variant, setVariant] = useState<ExperimentVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const experimentRef = useRef<Experiment | null>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const sessionId = getSessionId();
      sessionIdRef.current = sessionId;

      const experiments = await fetchActiveExperiments();
      if (cancelled) return;

      const experiment = experiments.find((e) => e.slug === experimentSlug);
      if (!experiment) {
        setIsLoading(false);
        return;
      }

      experimentRef.current = experiment;
      const assigned = assignVariant(experiment, sessionId);
      if (cancelled) return;

      setVariant(assigned);
      setIsLoading(false);

      // Fire impression once per session per experiment
      if (assigned && !impressionsFired.has(experiment.id)) {
        impressionsFired.add(experiment.id);
        trackImpression(experiment.id, assigned.id, sessionId);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [experimentSlug]);

  const trackConversion = useCallback(
    (revenue?: number) => {
      const exp = experimentRef.current;
      if (!exp || !variant || !sessionIdRef.current) return;
      trackConv(exp.id, variant.id, sessionIdRef.current, revenue);
    },
    [variant],
  );

  return {
    variant,
    variantName: variant?.name || null,
    isLoading,
    trackConversion,
  };
}
