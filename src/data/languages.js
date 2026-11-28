export const LANGUAGE_OPTIONS = [
  { value: "cpp", label: "C++" }, { value: "c", label: "C" },
  { value: "python", label: "Python" }, { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" }, { value: "jsx", label: "React JSX" },
  { value: "tsx", label: "React TSX" }, { value: "java", label: "Java" },
  { value: "csharp", label: "C#" }, { value: "go", label: "Go" },
  { value: "rust", label: "Rust" }, { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" }, { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" }, { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" }, { value: "css", label: "CSS" },
  { value: "json", label: "JSON" }, { value: "bash", label: "Bash / Shell" },
  { value: "markdown", label: "Markdown" }, { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" }, { value: "dockerfile", label: "Dockerfile" },
  { value: "r", label: "R" }, { value: "dart", label: "Dart" },
  { value: "scala", label: "Scala" }, { value: "perl", label: "Perl" },
  { value: "lua", label: "Lua" }, { value: "powershell", label: "PowerShell" },
  { value: "graphql", label: "GraphQL" }, { value: "text", label: "Plain text" }
];

export const LANGUAGE_LABELS = Object.freeze(
  Object.fromEntries(LANGUAGE_OPTIONS.map(({ value, label }) => [value, label]))
);

export function getLanguageLabel(value) {
  return LANGUAGE_LABELS[String(value || "text").toLowerCase()] || String(value || "Plain text");
}
