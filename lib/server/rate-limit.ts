import "server-only";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };
export interface RateLimiter { consume(key: string): Promise<RateLimitResult> }

/** Local/dev limiter only. Serverless instances do not share this state; replace it with a distributed adapter in production. */
export function createMemoryRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, number[]>();
  return {
    async consume(key) {
      try {
        const now = Date.now();
        const recent = (buckets.get(key) ?? []).filter((time) => time > now - windowMs);
        if (recent.length >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
        recent.push(now);
        buckets.set(key, recent);
        return { allowed: true, retryAfterSeconds: 0 };
      } catch {
        return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      }
    },
  };
}

export const aiRateLimiter = createMemoryRateLimiter(20, 60_000);
export const externalUrlRateLimiter = createMemoryRateLimiter(30, 60_000);
