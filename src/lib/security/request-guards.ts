const UNSAFE_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);
const DEFAULT_MAX_BODY_BYTES = 1_000_000;
const RECEIPT_MAX_BODY_BYTES = 5_500_000;

export function requestGuardFailure({
  contentLength,
  method,
  origin,
  pathname,
  requestOrigin,
}: {
  contentLength: string | null;
  method: string;
  origin: string | null;
  pathname: string;
  requestOrigin: string;
}): { message: string; status: number } | null {
  if (!UNSAFE_METHODS.has(method.toUpperCase())) return null;
  if (!origin || origin !== requestOrigin) return { message: "Invalid request origin.", status: 403 };

  const parsedLength = contentLength === null ? 0 : Number(contentLength);
  const maximum = pathname.endsWith("/receipts") ? RECEIPT_MAX_BODY_BYTES : DEFAULT_MAX_BODY_BYTES;
  if (!Number.isFinite(parsedLength) || parsedLength < 0 || parsedLength > maximum) {
    return { message: "Request body is too large.", status: 413 };
  }
  return null;
}
