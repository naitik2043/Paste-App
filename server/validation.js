const MAX_CONTENT_BYTES = 1024 * 1024;

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
export const LANGUAGES = new Set([
  "text", "javascript", "typescript", "jsx", "tsx", "python", "java", "cpp",
  "c", "csharp", "go", "rust", "sql", "json", "html", "css", "bash", "markdown",
  "yaml", "xml", "dockerfile", "php", "ruby", "kotlin", "swift"
]);

export function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((tag) => String(tag).trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 30))].slice(0, 10);
}

export function normalizeProblemUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let parsed;
  try { parsed = new URL(raw); } catch { throw invalid("Enter a valid LeetCode problem URL."); }
  if (parsed.protocol !== "https:" || !["leetcode.com", "www.leetcode.com"].includes(parsed.hostname)) {
    throw invalid("Problem links must point to leetcode.com.");
  }
  return parsed.origin + parsed.pathname;
}

export function normalizePaste(input, current) {
  const source = input || {};
  const title = Object.prototype.hasOwnProperty.call(source, "title")
    ? String(source.title || "").trim()
    : current ? current.title : "";
  const content = Object.prototype.hasOwnProperty.call(source, "content")
    ? String(source.content == null ? "" : source.content)
    : current ? current.content : "";

  if (title.length < 2 || title.length > 100) throw invalid("Title must be between 2 and 100 characters.");
  if (!content.trim()) throw invalid("Paste content cannot be empty.");
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) throw invalid("Paste content must be 1 MB or smaller.");

  const language = String(source.language || current?.language || "text").toLowerCase();
  const category = String(source.category || current?.category || "snippet");
  const visibility = String(source.visibility || current?.visibility || "private");
  const difficulty = String(source.difficulty || current?.difficulty || "");

  if (!LANGUAGES.has(language)) throw invalid("Choose a supported programming language.");
  if (!["snippet", "solution", "template", "notes"].includes(category)) throw invalid("Choose a valid paste category.");
  if (!["private", "unlisted"].includes(visibility)) throw invalid("Choose Private or Unlisted visibility.");
  if (!["", "Easy", "Medium", "Hard"].includes(difficulty)) throw invalid("Choose a valid problem difficulty.");

  const result = {
    title,
    content,
    language,
    category,
    visibility,
    difficulty,
    problemTitle: String(source.problemTitle ?? current?.problemTitle ?? "").trim().slice(0, 120),
    problemUrl: Object.prototype.hasOwnProperty.call(source, "problemUrl")
      ? normalizeProblemUrl(source.problemUrl)
      : current?.problemUrl || "",
    topic: String(source.topic ?? current?.topic ?? "").trim().slice(0, 60),
    approach: String(source.approach ?? current?.approach ?? "").trim(),
    timeComplexity: String(source.timeComplexity ?? current?.timeComplexity ?? "").trim(),
    spaceComplexity: String(source.spaceComplexity ?? current?.spaceComplexity ?? "").trim(),
    keyTakeaway: String(source.keyTakeaway ?? current?.keyTakeaway ?? "").trim(),
    tags: Object.prototype.hasOwnProperty.call(source, "tags")
      ? normalizeTags(source.tags)
      : current?.tags || []
  };

  if (result.approach.length > 2000) throw invalid("Approach notes must be 2,000 characters or fewer.");
  if (result.timeComplexity.length > 80 || result.spaceComplexity.length > 80) {
    throw invalid("Complexity notes must be 80 characters or fewer.");
  }
  if (result.keyTakeaway.length > 1000) throw invalid("Key takeaway must be 1,000 characters or fewer.");
}
