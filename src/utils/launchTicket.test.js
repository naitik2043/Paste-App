import test from "node:test";
import assert from "node:assert/strict";
import { readLaunchTicket } from "./launchTicket.js";

test("reads the one-time ticket from the URL fragment", () => {
  assert.equal(readLaunchTicket("#sso=abc_123-xyz"), "abc_123-xyz");
});

test("decodes URL-encoded ticket values", () => {
  assert.equal(readLaunchTicket("#sso=token%2Bpart%3Dvalue"), "token+part=value");
});

test("returns an empty ticket when no SSO fragment is present", () => {
  assert.equal(readLaunchTicket(""), "");
  assert.equal(readLaunchTicket("#section=overview"), "");
  assert.equal(readLaunchTicket("?sso=not-in-fragment"), "");
});
