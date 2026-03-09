// In-memory rate limiter (dev-friendly, no Redis required)
// For production: swap with @upstash/ratelimit + @upstash/redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Limits
export const COACH_LIMIT = { max: 60, windowMs: 60 * 60 * 1000 }; // 60/hour
export const GENERATOR_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 }; // 20/hour
