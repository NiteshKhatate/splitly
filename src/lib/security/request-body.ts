export const MAX_JSON_BODY_BYTES = 1_000_000;

export class RequestBodyError extends Error {
  constructor(readonly code: "INVALID_JSON" | "TOO_LARGE") {
    super(code === "TOO_LARGE" ? "Request body is too large." : "Request body is invalid.");
    this.name = "RequestBodyError";
  }
}

export async function readJsonBody(
  request: Request,
  maximumBytes = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  if (!request.body) throw new RequestBodyError("INVALID_JSON");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyError("TOO_LARGE");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new RequestBodyError("INVALID_JSON");
  }
}
