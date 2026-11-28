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
    folderId: Object.prototype.hasOwnProperty.call(source, "folderId")
      ? String(source.folderId || "").trim()
      : current?.folderId ? String(current.folderId) : "",
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
  return result;
}


const SHARE_DURATIONS = Object.freeze({
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000
});

export function normalizeShareExpiry(duration = "7d", now = Date.now()) {
  const selected = String(duration || "7d");
  if (selected === "never") return null;
  const lifetime = SHARE_DURATIONS[selected];
  if (!lifetime) throw invalid("Choose a valid share link expiration.");
  return new Date(now + lifetime);
}

const SHARE_VIEW_LIMITS = new Set([0, 1, 5, 10, 25, 100]);

export function normalizeShareViewLimit(value = 0) {
  const isNumericInput = typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value));
  const limit = Number(value);
  if (!isNumericInput || !Number.isInteger(limit) || !SHARE_VIEW_LIMITS.has(limit)) {
    throw invalid("Choose a supported share view limit.");
  }
  return limit;
}

export function shareViewLimitReached(limit = 0, viewsUsed = 0) {
  const maximum = Number(limit) || 0;
  const used = Number(viewsUsed) || 0;
  return maximum > 0 && used >= maximum;
}


export const FOLDER_COLORS = new Set(["blue", "violet", "green", "amber", "rose", "slate"]);

export function normalizeFolder(input) {
  const source = input || {};
  const name = String(source.name || "").trim().replace(/\s+/g, " ");
  const color = String(source.color || "blue").toLowerCase();
  if (name.length < 2 || name.length > 40) throw invalid("Folder names must be between 2 and 40 characters.");
  if (!FOLDER_COLORS.has(color)) throw invalid("Choose a supported folder color.");
  return { name, nameKey: name.toLocaleLowerCase("en-US"), color };
}

export function validateImportBatch(input) {
  const source = input || {};
  if (source.format !== "paste-vault-export" || Number(source.version) !== 1) {
    throw invalid("This is not a supported Paste Vault export file.");
  }
  if (!Array.isArray(source.snippets) || source.snippets.length < 1 || source.snippets.length > 10) {
    throw invalid("Import batches must contain between 1 and 10 snippets.");
  }
  return source.snippets.map((snippet) => {
    const normalized = normalizePaste({
      ...snippet,
      visibility: "private",
      tags: snippet.tags || []
    });
    const folderName = String(snippet.folderName || "").trim().replace(/\s+/g, " ");
    if (folderName.length > 40) throw invalid("Imported folder names must be 40 characters or fewer.");
    return {
      ...normalized,
      folderName,
      isPinned: Boolean(snippet.isPinned)
    };
  });
}
