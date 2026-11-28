import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter, isSameOrigin } from "./security.js";

test("accepts a request from the exact application origin", () => {
  assert.equal(isSameOrigin({
    headers: { origin: "https://paste-app-wine.vercel.app", host: "paste-app-wine.vercel.app" }
  }), true);
});

test("rejects a cross-origin state-changing request", () => {
  assert.equal(isSameOrigin({
    headers: { origin: "https://attacker.example", host: "paste-app-wine.vercel.app" }
  }), false);
});

test("fails closed for malformed origins and cross-site requests without Origin", () => {
  assert.equal(isSameOrigin({ headers: { origin: "not a URL", host: "paste-app-wine.vercel.app" } }), false);
  assert.equal(isSameOrigin({ headers: { "sec-fetch-site": "cross-site", host: "paste-app-wine.vercel.app" } }), false);
  assert.equal(isSameOrigin({ headers: { host: "localhost:5173" } }), true);
});

test("rate limiter blocks bursts and resets after the configured window", () => {
  const limit = createRateLimiter();
  const request = { headers: { "x-forwarded-for": "203.0.113.10" } };
  const options = { key: "create", limit: 2, windowMs: 1000, now: 1000 };

  assert.equal(limit(request, options).allowed, true);
  assert.equal(limit(request, options).allowed, true);
  const blocked = limit(request, options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
  assert.equal(limit(request, { ...options, now: 2000 }).allowed, true);
});
