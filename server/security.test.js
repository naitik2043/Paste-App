import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter, isSameOrigin } from "./security.js";

test("accepts same-origin requests using the forwarded public host", () => {
  assert.equal(isSameOrigin({
    headers: {
      origin: "https://vault.example.com",
      host: "internal.vercel",
      "x-forwarded-host": "vault.example.com"
    }
  }), true);
});

test("rejects cross-origin and malformed origin headers", () => {
  assert.equal(isSameOrigin({
    headers: { origin: "https://attacker.example", host: "vault.example.com" }
  }), false);
  assert.equal(isSameOrigin({
    headers: { origin: "not a URL", host: "vault.example.com" }
  }), false);
});

test("rejects fetch-marked cross-site requests without an Origin header", () => {
  assert.equal(isSameOrigin({
    headers: { "sec-fetch-site": "cross-site" }
  }), false);
});

test("allows same-origin and non-browser requests without a cross-site marker", () => {
  assert.equal(isSameOrigin({ headers: {} }), true);
  assert.equal(isSameOrigin({
    headers: { origin: "https://vault.example.com", host: "vault.example.com" }
  }), true);
});

test("rate limits a client within its window and resets after expiry", () => {
  const limit = createRateLimiter();
  const req = { headers: { "x-forwarded-for": "203.0.113.10" } };
  const options = { key: "share-unlock", limit: 2, windowMs: 1000, now: 10_000 };

  assert.deepEqual(limit(req, options), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(limit(req, options), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(limit(req, options), { allowed: false, retryAfterSeconds: 1 });
  assert.deepEqual(limit(req, { ...options, now: 11_001 }), { allowed: true, retryAfterSeconds: 0 });
});

test("isolates rate-limit buckets by action and client address", () => {
  const limit = createRateLimiter();
  const firstClient = { headers: { "x-forwarded-for": "203.0.113.10" } };
  const secondClient = { headers: { "x-forwarded-for": "203.0.113.11" } };
  const options = { key: "auth", limit: 1, windowMs: 60_000, now: 5_000 };

  assert.equal(limit(firstClient, options).allowed, true);
  assert.equal(limit(firstClient, options).allowed, false);
  assert.equal(limit(secondClient, options).allowed, true);
  assert.equal(limit(firstClient, { ...options, key: "share" }).allowed, true);
});
