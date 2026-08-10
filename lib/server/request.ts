import "server-only";

export class RequestBodyTooLargeError extends Error {
  override name = "RequestBodyTooLargeError";
}

export async function readJsonBody(request: Request, maxBytes = 1_000_000): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  return JSON.parse(text);
}

export async function readFormDataBody(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  if (!request.body) return request.formData();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new RequestBodyTooLargeError("Request body is too large."); }
    chunks.push(value);
  }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new Request(request.url, { method: request.method, headers: request.headers, body }).formData();
}

export function jsonBodyError(error: unknown) {
  return Response.json(
    { error: error instanceof RequestBodyTooLargeError ? error.message : "Request body must contain valid JSON." },
    { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
  );
}
