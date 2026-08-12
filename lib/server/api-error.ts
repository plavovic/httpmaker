export function apiError(code: string, message: string, status: number, details?: unknown, headers?: HeadersInit) {
  return Response.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, { status, headers });
}
