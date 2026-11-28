import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTags, normalizeProblemUrl, normalizePaste, normalizeShareExpiry } from "./validation.js";

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

test("stores structured intuition, complexity and review takeaways", () => {
  const paste = normalizePaste({
    title: "Sliding Window",
    content: "int solve() { return 0; }",
    approach: "Maintain a moving window and shrink it while the constraint is violated.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    keyTakeaway: "Check the empty window and repeated characters."
  });
  assert.equal(paste.approach.startsWith("Maintain a moving window"), true);
  assert.equal(paste.timeComplexity, "O(n)");
  assert.equal(paste.spaceComplexity, "O(1)");
  assert.match(paste.keyTakeaway, /repeated characters/);
  assert.throws(() => normalizePaste({
    title: "Too much approach",
    content: "code",
    approach: "x".repeat(2001)
  }), /2,000 characters/);
});


test("normalizes supported share link expiration policies", () => {
  const now = 1_800_000_000_000;
  assert.equal(normalizeShareExpiry("1d", now).getTime(), now + 24 * 60 * 60 * 1000);
  assert.equal(normalizeShareExpiry("7d", now).getTime(), now + 7 * 24 * 60 * 60 * 1000);
  assert.equal(normalizeShareExpiry("30d", now).getTime(), now + 30 * 24 * 60 * 60 * 1000);
  assert.equal(normalizeShareExpiry("never", now), null);
  assert.throws(() => normalizeShareExpiry("forever-ish", now), /expiration/);
});
