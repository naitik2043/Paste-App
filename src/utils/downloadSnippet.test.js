import test from "node:test";
import assert from "node:assert/strict";
import { getSnippetFilename } from "./downloadSnippet.js";

test("creates safe filenames with language-specific extensions", () => {
  assert.equal(getSnippetFilename("Two Sum / Hash Map", "cpp"), "two-sum-hash-map.cpp");
  assert.equal(getSnippetFilename("React Component", "tsx"), "react-component.tsx");
  assert.equal(getSnippetFilename("SQL joins", "sql"), "sql-joins.sql");
  assert.equal(getSnippetFilename("", "unknown"), "snippet.txt");
});

test("bounds and sanitizes filenames", () => {
  const result = getSnippetFilename("A".repeat(100), "python");
  assert.equal(result.length, 67);
  assert.match(result, /\.py$/);
  assert.equal(getSnippetFilename("../../credentials", "text"), "credentials.txt");
});
