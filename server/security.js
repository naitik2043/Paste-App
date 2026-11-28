export function isSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return req.headers?.["sec-fetch-site"] !== "cross-site";

  const requestHost = String(
    req.headers?.["x-forwarded-host"] || req.headers?.host || ""
  ).split(",")[0].trim().toLowerCase();

  try {
    return Boolean(requestHost) && new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

export function createRateLimiter({ maxBuckets = 5000 } = {}) {
  const buckets = new Map();

  return function rateLimit(req, { key, limit, windowMs, now = Date.now() }) {
    const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
    const ip = forwarded || req.socket?.remoteAddress || "unknown";
    const bucketKey = `${key}:${ip}`;
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.delete(bucketKey);
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    } else if (current.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      };
    } else {
      current.count += 1;
      buckets.delete(bucketKey);
      buckets.set(bucketKey, current);
    }

    for (const [storedKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(storedKey);
    }
    while (buckets.size > maxBuckets) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) break;
      buckets.delete(oldestKey);
    }

    return { allowed: true, retryAfterSeconds: 0 };
  };
}
