import type { AiApiResponse, AiRequest, AiSuccessResponse } from "@/types/ai";
import { aiApiResponseSchema, aiRequestSchema } from "@/utils/aiValidationSchemas";

export class AiClientError extends Error {
  constructor(message: string, public readonly response?: AiApiResponse) { super(message); this.name = "AiClientError"; }
}

export async function requestAiProposal(request: AiRequest, signal?: AbortSignal): Promise<AiSuccessResponse> {
  const requestResult = aiRequestSchema.safeParse(request);
  if (!requestResult.success) throw new AiClientError("The AI request is invalid.");
  const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestResult.data), signal });
  const payload: unknown = await response.json();
  const responseResult = aiApiResponseSchema.safeParse(payload);
  if (!responseResult.success) throw new AiClientError("The AI service returned an invalid response.");
  if (!response.ok || !responseResult.data.success) throw new AiClientError(responseResult.data.success ? "The AI request failed." : responseResult.data.error.message, responseResult.data);
  return responseResult.data;
}
