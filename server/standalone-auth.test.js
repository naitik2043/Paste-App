import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthToken,
  hashAuthToken,
  hashPassword,
  normalizeEmail,
  normalizeProfileUpdate,
  verifyPassword
} from "./standalone-auth.js";

test("normalizes account email addresses consistently", () => {
  assert.equal(normalizeEmail("  Dev@Example.COM "), "dev@example.com");
});

test("stores password hashes with unique salts and verifies credentials safely", () => {
  const first = hashPassword("correct horse battery");
  const second = hashPassword("correct horse battery");

  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, "correct horse battery");
  assert.equal(verifyPassword("correct horse battery", first.salt, first.hash), true);
  assert.equal(verifyPassword("incorrect horse battery", first.salt, first.hash), false);
  assert.equal(verifyPassword("correct horse battery", first.salt, "invalid"), false);
});

test("creates opaque verification tokens and stores only their digest", () => {
  const token = createAuthToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(hashAuthToken(token).length, 64);
  assert.notEqual(hashAuthToken(token), token);
});

test("normalizes editable profile fields and enforces HTTPS links", () => {
  assert.deepEqual(normalizeProfileUpdate({
    name: "  Ada Lovelace ",
    bio: "Engineer",
    location: "London",
    website: "example.com",
    github: "https://github.com/ada",
    linkedin: "linkedin.com/in/ada",
    avatarUrl: "https://cdn.example.com/avatar.png"
  }), {
    name: "Ada Lovelace",
    bio: "Engineer",
    location: "London",
    avatarUrl: "https://cdn.example.com/avatar.png",
    website: "https://example.com",
    github: "https://github.com/ada",
    linkedin: "https://linkedin.com/in/ada"
  });
  assert.throws(() => normalizeProfileUpdate({ name: "Ada", website: "javascript:alert(1)" }), /HTTPS URL/);
  assert.throws(() => normalizeProfileUpdate({ name: " " }), /required/);
});
