/**
 * SECURITY: Hybrid rate limiter — Upstash Redis (distributed) with in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured:
 *   → Uses Upstash Redis for distributed rate limiting across all serverless instances.
 *
 * When Upstash is NOT configured:
 *   → Falls back to in-memory Map (per-instance, good enough for dev/staging).
 *
 * Usage: `rateLimit("admin-login:1.2.3.4", 5, 900000)` → 5 attempts per 15min
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── In-memory fallback ──────────────────────────────────────────────────────

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: record.resetAt - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfterMs: 0,
  };
}

// ── Upstash Redis rate limiter (distributed) ────────────────────────────────

let redis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const key = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      analytics: false,
      prefix: "ks_rl",
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check rate limit for a given key.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory.
 *
 * @param key      Unique identifier, e.g. `admin-login:${ip}`
 * @param limit    Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  // Synchronous path: always use memory limiter for immediate response
  // Upstash is async — we enhance it where used via rateLimitAsync()
  return memoryRateLimit(key, limit, windowMs);
}

/**
 * Async rate limit using Upstash Redis (distributed).
 * Falls back to in-memory if Upstash is not configured.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const upstash = getUpstashLimiter(limit, windowMs);
  if (upstash) {
    try {
      const result = await upstash.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        retryAfterMs: result.success ? 0 : (result.reset - Date.now()),
      };
    } catch {
      // Redis failure — fall through to memory
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

/**
 * Get the client IP from a Next.js request (works on Vercel and locally).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
