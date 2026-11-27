import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";

export default function CodeBlock({ code, language = "text", compact = false }) {
  const safeLanguage = hljs.getLanguage(language) ? language : "plaintext";
  const highlighted = safeLanguage === "plaintext"
    ? hljs.highlightAuto(String(code || "")).value
    : hljs.highlight(String(code || ""), { language: safeLanguage }).value;

  return (
    <pre className={"code-block" + (compact ? " code-block-compact" : "")}>
      <code className={"hljs language-" + safeLanguage} dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
