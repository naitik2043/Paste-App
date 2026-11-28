import test from "node:test";
import assert from "node:assert/strict";
import { getSnippetFilename } from "./downloadSnippet.js";

test("creates a safe filename with the language-specific extension", () => {
  assert.equal(getSnippetFilename("  Graph / BFS!! ", "cpp"), "graph-bfs.cpp");
  assert.equal(getSnippetFilename("Two Sum", "python"), "two-sum.py");
});

test("uses a safe fallback for missing titles and unknown languages", () => {
  assert.equal(getSnippetFilename("", "unknown-language"), "snippet.txt");
  assert.equal(getSnippetFilename("My Notes", "text"), "my-notes.txt");
});

test("limits generated slugs and strips unsafe punctuation", () => {
  const name = getSnippetFilename("A".repeat(100) + "../bad", "javascript");
  assert.equal(name.length, 67);
  assert.match(name, /^[a-z0-9-]+\.js$/);
});
