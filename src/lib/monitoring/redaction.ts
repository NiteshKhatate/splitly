const SENSITIVE_KEY = /(authorization|cookie|credential|database.?url|direct.?url|email|password|secret|service.?role|token)/i;
const FINANCIAL_KEY = /(amount|balance|note|payment|share|total)/i;

function redactString(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]");
}

export function redactForLogging(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[REDACTED_DEPTH]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactForLogging(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    SENSITIVE_KEY.test(key) || FINANCIAL_KEY.test(key) ? "[REDACTED]" : redactForLogging(nested, depth + 1),
  ]));
}

export function logWarning(event: string, context: Record<string, unknown> = {}) {
  console.warn(event, redactForLogging(context));
}

export function logError(event: string, context: Record<string, unknown> = {}) {
  console.error(event, redactForLogging(context));
}

const consoleRedactionMarker = Symbol.for("splitly.console-redaction");

export function installServerConsoleRedaction() {
  const globalState = globalThis as typeof globalThis & { [consoleRedactionMarker]?: boolean };
  if (globalState[consoleRedactionMarker]) return;
  globalState[consoleRedactionMarker] = true;
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  console.warn = (...values: unknown[]) => originalWarn(...values.map((value) => redactForLogging(value)));
  console.error = (...values: unknown[]) => originalError(...values.map((value) => redactForLogging(value)));
}
