const EXTENSIONS = Object.freeze({
  bash: "sh", c: "c", cpp: "cpp", csharp: "cs", css: "css", dockerfile: "dockerfile",
  go: "go", html: "html", java: "java", javascript: "js", json: "json",
  kotlin: "kt", markdown: "md", php: "php", python: "py", ruby: "rb", rust: "rs",
  sql: "sql", swift: "swift", text: "txt", tsx: "tsx", typescript: "ts", xml: "xml", yaml: "yml"
});

export function getSnippetFilename(title, language) {
  const slug = String(title || "snippet")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "snippet";
  const extension = EXTENSIONS[String(language || "text").toLowerCase()] || "txt";
  return `${slug}.${extension}`;
}

export function downloadSnippet(paste) {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") {
    throw new Error("Downloads are available in a browser.");
  }
  const blob = new Blob([String(paste?.content || "")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getSnippetFilename(paste?.title, paste?.language);
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return anchor.download;
}
