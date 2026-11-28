import test from "node:test";
import assert from "node:assert/strict";
import { createRouteHandler } from "./route-utils.js";

test("maps a static API route into request path segments", async () => {
  const req = { query: { existing: "value" } };
  const expected = { ok: true };
  const handler = createRouteHandler((request) => {
    assert.deepEqual(request.query, { existing: "value", path: ["pastes", "123"] });
    return expected;
  }, ["pastes", "123"]);

  assert.equal(await handler(req, {}), expected);
});

test("resolves route segments from the incoming request", () => {
  const req = { query: { id: "abc" } };
  const handler = createRouteHandler((request) => request.query.path, (request) => [
    "pastes", request.query.id, "", null
  ]);

  assert.deepEqual(handler(req, {}), ["pastes", "abc"]);
});

test("rejects invalid handler and path configuration", () => {
  assert.throws(() => createRouteHandler(null, "pastes"), /handler function/);
  assert.throws(() => createRouteHandler(() => {}, 42), /route path/);
});
