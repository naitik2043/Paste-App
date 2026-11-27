import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTags, normalizeProblemUrl, normalizePaste } from "./validation.js";

test("normalizes tags, removes duplicates and limits the collection", () => {
  assert.deepEqual(normalizeTags([" DP ", "dp", "Graphs", "", "arrays"]), ["dp", "graphs", "arrays"]);
  assert.equal(normalizeTags(Array.from({ length: 15 }, (_, i) => "tag" + i)).length, 10);
});

test("accepts canonical LeetCode links and rejects other hosts", () => {
  assert.equal(
    normalizeProblemUrl("https://leetcode.com/problems/two-sum/?envType=study-plan"),
    "https://leetcode.com/problems/two-sum/"
  );
  assert.throws(() => normalizeProblemUrl("https://evil.example/problems/two-sum"), /leetcode.com/);
  assert.throws(() => normalizeProblemUrl("javascript:alert(1)"), /leetcode.com/);
});

test("validates required content and the 1 MB content limit", () => {
  assert.throws(() => normalizePaste({ title: "A", content: "x" }), /2 and 100/);
  assert.throws(() => normalizePaste({ title: "Valid title", content: "  " }), /cannot be empty/);
  assert.throws(() => normalizePaste({
    title: "Valid title", content: "x".repeat(1024 * 1024 + 1)
  }), /1 MB/);
});

test("normalizes a LeetCode solution payload", () => {
  const paste = normalizePaste({
    title: "Binary Search",
    content: "int search(vector<int>& a) { return 1; }",
    language: "cpp",
    category: "solution",
    difficulty: "Medium",
    tags: ["Binary Search", "Arrays"],
    problemUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/"
  });
  assert.equal(paste.title, "Binary Search");
  assert.deepEqual(paste.tags, ["binary search", "arrays"]);
  assert.equal(paste.visibility, "private");
});
