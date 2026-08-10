import "server-only";

export class RequestBodyTooLargeError extends Error {}

export async function readJsonBody(request: Request, maxBytes = 1_000_000): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  return JSON.parse(text);
}

export function jsonBodyError(error: unknown) {
  return Response.json(
    { error: error instanceof RequestBodyTooLargeError ? error.message : "Request body must contain valid JSON." },
    { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
  );
}
