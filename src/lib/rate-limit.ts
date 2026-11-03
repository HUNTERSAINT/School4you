/**
 * Small in-memory fixed-window rate limiter.
 *
 * It protects a single server instance (fine for one Railway service). If you scale to several
 * instances, replace the Map with a shared store such as Redis/Upstash so limits are global.
 */
type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 20_000;
let lastSweep = 0;

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

function sweep(now: number) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) buckets.clear();
}

export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
  if (now - lastSweep > 60_000) {
    sweep(now);
    lastSweep = now;
  }
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export function resetRateLimits() {
  buckets.clear();
  lastSweep = 0;
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
