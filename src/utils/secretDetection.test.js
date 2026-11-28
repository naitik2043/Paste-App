import test from "node:test";
import assert from "node:assert/strict";
import { detectPotentialSecrets } from "./secretDetection.js";

test("detects common credential patterns without returning matched values", () => {
  const content = [
    "-----BEGIN PRIVATE KEY-----",
    "ghp_" + "a".repeat(30),
    "AKIA" + "A".repeat(16),
    "AIza" + "B".repeat(35),
    "xoxb-" + "c".repeat(20),
    "sk-" + "d".repeat(24),
    "mongodb+srv://demo:example-password@cluster.example/db",
    'client_secret = "this-is-only-a-fake-secret"'
  ].join("\n");

  const matches = detectPotentialSecrets(content);
  assert.deepEqual(matches, [
    "private key block",
    "GitHub access token",
    "AWS access key ID",
    "Google API key",
    "Slack access token",
    "OpenAI-style API key",
    "database credential URI",
    "credential-like assignment"
  ]);
  assert.equal(matches.some((value) => value.includes("example-password")), false);
  assert.equal(matches.join(" ").includes("fake-secret"), false);
});

test("does not flag ordinary code or return duplicate labels", () => {
  const content = "const total = items.length;\nfunction add(a, b) { return a + b; }";
  assert.deepEqual(detectPotentialSecrets(content), []);
});

test("handles empty and non-string input safely", () => {
  assert.deepEqual(detectPotentialSecrets(""), []);
  assert.deepEqual(detectPotentialSecrets(null), []);
  assert.deepEqual(detectPotentialSecrets({}), []);
});
