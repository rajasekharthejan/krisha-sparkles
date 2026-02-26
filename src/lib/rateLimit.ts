/**
 * SECURITY: Simple in-memory rate limiter.
 * Works per serverless instance — good enough to stop casual abuse.
 * For production-scale, replace with Upstash Redis ratelimit.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Map of key → { count, resetAt }
const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit for a given key.
 * @param key      Unique identifier, e.g. `ip:${ip}` or `user:${userId}`
 * @param limit    Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean; remaining: number; retryAfterMs: number }
 */
export function rateLimit(
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

/**
 * Get the client IP from a Next.js request (works on Vercel and locally).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
