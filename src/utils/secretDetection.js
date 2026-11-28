const SECRET_PATTERNS = [
  { label: "private key block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i },
  { label: "GitHub access token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/ },
  { label: "AWS access key ID", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "Slack access token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: "OpenAI-style API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "database credential URI", pattern: /\bmongodb(?:\+srv)?:\/\/[^\s:@/]+:[^\s@/]+@/i },
  {
    label: "credential-like assignment",
    pattern: /\b(?:password|passwd|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'`][^"'`\r\n]{8,}["'`]/i
  }
];

/**
 * Client-side advisory only. This never returns the matched secret itself.
 */
export function detectPotentialSecrets(source) {
  const text = String(source || "");
  if (!text) return [];
  return SECRET_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}
