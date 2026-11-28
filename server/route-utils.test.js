import test from "node:test";
import assert from "node:assert/strict";
import { createRouteHandler } from "./route-utils.js";

test("maps a static API route while preserving query parameters", () => {
  let received;
  const handler = createRouteHandler((req) => { received = req.query; }, ["pastes"]);
  const req = { query: { limit: "20" } };

  handler(req, {});

  assert.deepEqual(received, { limit: "20", path: ["pastes"] });
});

test("resolves dynamic route parameters from Vercel query values", () => {
  let received;
  const handler = createRouteHandler(
    (req) => { received = req.query.path; },
    (req) => ["pastes", String(req.query.id || "")]
  );

  handler({ query: { id: "507f1f77bcf86cd799439011" } }, {});

  assert.deepEqual(received, ["pastes", "507f1f77bcf86cd799439011"]);
});

test("normalizes a string route and discards empty path segments", () => {
  let received;
  createRouteHandler((req) => { received = req.query.path; }, "stats")({ query: null }, {});
  assert.deepEqual(received, ["stats"]);
  assert.throws(() => createRouteHandler(null, ["pastes"]), /handler function/);
});
