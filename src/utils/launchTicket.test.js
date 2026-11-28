import test from "node:test";
import assert from "node:assert/strict";
import { readLaunchTicket } from "./launchTicket.js";

test("reads and decodes the one-time ticket from the URL fragment", () => {
  assert.equal(readLaunchTicket("#sso=ticket%2Bvalue%3D%3D&source=leetmetric"), "ticket+value==");
});

test("returns an empty ticket when the fragment has no SSO parameter", () => {
  assert.equal(readLaunchTicket("#source=leetmetric"), "");
  assert.equal(readLaunchTicket(""), "");
  assert.equal(readLaunchTicket(null), "");
});

test("does not read SSO credentials from the regular query string", () => {
  assert.equal(readLaunchTicket("sso=not-a-fragment"), "");
});
