import test from "node:test";
import assert from "node:assert/strict";
import { detectPotentialSecrets } from "./secretDetection.js";

test("detects common credential and private-key patterns without returning values", () => {
  const source = [
    "const token = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';",
    "const accessKey = 'AKIA1234567890ABCDEF';",
    "-----BEGIN PRIVATE KEY-----"
  ].join("\n");
  const warnings = detectPotentialSecrets(source);
  assert.ok(warnings.includes("GitHub access token"));
  assert.ok(warnings.includes("AWS access key ID"));
  assert.ok(warnings.includes("private key block"));
  assert.equal(warnings.some((value) => value.includes("ghp_")), false);
});

test("detects credential assignments and database URLs", () => {
  const warnings = detectPotentialSecrets(
    'password = "this-is-not-a-safe-password"\nMONGODB_URI="mongodb+srv://admin:longsecret@cluster.example/db"'
  );
  assert.ok(warnings.includes("credential-like assignment"));
  assert.ok(warnings.includes("database credential URI"));
});

test("does not warn on ordinary code or placeholder examples", () => {
  assert.deepEqual(detectPotentialSecrets("const sum = (a, b) => a + b;"), []);
  assert.deepEqual(detectPotentialSecrets("API_KEY=your_api_key_here"), []);
  assert.deepEqual(detectPotentialSecrets(""), []);
});
