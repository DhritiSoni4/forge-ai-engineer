const TOKEN_PATTERNS: RegExp[] = [
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
];

const MIN_SECRET_LENGTH = 6;

/**
 * Removes known secret values and common token shapes from text before it is
 * logged, stored, or returned to the model.
 */
export function redact(text: string, secrets: Iterable<string> = []): string {
  let result = text;

  const known = [...secrets]
    .filter((secret) => secret.length >= MIN_SECRET_LENGTH)
    .sort((a, b) => b.length - a.length);
  for (const secret of known) {
    result = result.split(secret).join("[REDACTED]");
  }

  for (const pattern of TOKEN_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}
