import test from "node:test";
import assert from "node:assert/strict";
import { createSharePassword, verifySharePassword } from "./share-security.js";

test("hashes share passwords with random salts and verifies the correct password", () => {
  const first = createSharePassword("correct horse battery staple");
  const second = createSharePassword("correct horse battery staple");
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(verifySharePassword("correct horse battery staple", first.salt, first.hash), true);
  assert.equal(verifySharePassword("incorrect password", first.salt, first.hash), false);
});

test("rejects weak and malformed share passwords", () => {
  assert.throws(() => createSharePassword("short"), /8 and 128/);
  assert.throws(() => createSharePassword("x".repeat(129)), /8 and 128/);
  assert.equal(verifySharePassword("password123", "bad-salt", "bad-hash"), false);
  assert.equal(verifySharePassword("x".repeat(129), "a".repeat(32), "b".repeat(128)), false);
});
