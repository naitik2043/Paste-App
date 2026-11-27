const MAX_CONTENT_BYTES = 1024 * 1024;
const LANGUAGES = new Set([
  "text", "javascript", "typescript", "jsx", "tsx", "python", "java", "cpp",
  "c", "csharp", "go", "rust", "sql", "json", "html", "css", "bash", "markdown",
  "yaml", "xml", "dockerfile", "php", "ruby", "kotlin", "swift"
]);

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((tag) => String(tag).trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 30))].slice(0, 10);
}

function normalizeProblemUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error("Enter a valid LeetCode problem URL."); }
  if (parsed.protocol !== "https:" || !["leetcode.com", "www.leetcode.com"].includes(parsed.hostname)) {
    throw new Error("Problem links must point to leetcode.com.");
  }
  return parsed.origin + parsed.pathname;
}

function normalizePaste(input, current) {
  const source = input || {};
  const title = Object.prototype.hasOwnProperty.call(source, "title")
    ? String(source.title || "").trim()
    : current ? current.title : "";
  const content = Object.prototype.hasOwnProperty.call(source, "content")
    ? String(source.content == null ? "" : source.content)
    : current ? current.content : "";
  if (title.length < 2 || title.length > 100) throw new Error("Title must be between 2 and 100 characters.");
  if (!content.trim()) throw new Error("Paste content cannot be empty.");
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) throw new Error("Paste content must be 1 MB or smaller.");
  const language = String(source.language || current?.language || "text").toLowerCase();
  const category = String(source.category || current?.category || "snippet");
  const visibility = String(source.visibility || current?.visibility || "private");
  const difficulty = String(source.difficulty || current?.difficulty || "");
  if (!LANGUAGES.has(language)) throw new Error("Choose a supported programming language.");
  if (!["snippet", "solution", "template", "notes"].includes(category)) throw new Error("Choose a valid paste category.");
  if (!["private", "unlisted"].includes(visibility)) throw new Error("Choose Private or Unlisted visibility.");
  if (!["", "Easy", "Medium", "Hard"].includes(difficulty)) throw new Error("Choose a valid problem difficulty.");
  return {
    title, content, language, category, visibility, difficulty,
    problemTitle: String(source.problemTitle ?? current?.problemTitle ?? "").trim().slice(0, 120),
    problemUrl: Object.prototype.hasOwnProperty.call(source, "problemUrl")
      ? normalizeProblemUrl(source.problemUrl)
      : current?.problemUrl || "",
    topic: String(source.topic ?? current?.topic ?? "").trim().slice(0, 60),
    tags: Object.prototype.hasOwnProperty.call(source, "tags") ? normalizeTags(source.tags) : current?.tags || []
  };
}

module.exports = { MAX_CONTENT_BYTES, LANGUAGES, normalizeTags, normalizeProblemUrl, normalizePaste };
