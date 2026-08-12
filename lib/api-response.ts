export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } };

export class ApiResponseError extends Error {
  constructor(message: string, public readonly code = "UNEXPECTED_RESPONSE", public readonly status = 0) {
    super(message);
    this.name = "ApiResponseError";
  }
}

export async function readApiResponse<T>(response: Response, options: { allowEmpty?: boolean } = {}): Promise<T | undefined> {
  const text = await response.text();
  if (!text.trim()) {
    if ((response.status === 204 || options.allowEmpty) && response.ok) return undefined;
    throw new ApiResponseError("The server returned an empty response. Please try again.", "EMPTY_RESPONSE", response.status);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiResponseError("The server returned an unexpected response. Please try again.", "NON_JSON_RESPONSE", response.status);
  }
  let body: unknown;
  try { body = JSON.parse(text); }
  catch { throw new ApiResponseError("The server returned an invalid response. Please try again.", "INVALID_JSON_RESPONSE", response.status); }
  if (!response.ok) {
    const error = (body as Partial<ApiErrorBody>)?.error;
    if (error && typeof error === "object" && typeof error.message === "string") throw new ApiResponseError(error.message, error.code, response.status);
    throw new ApiResponseError("The request could not be completed. Please try again.", "UNEXPECTED_ERROR_RESPONSE", response.status);
  }
  return body as T;
}
