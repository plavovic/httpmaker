import { NextResponse } from "next/server";
import { getAiProvider } from "@/services/ai/getAiProvider";
import { AiProviderError } from "@/services/ai/provider";
import type { AiApiResponse, AiErrorCode } from "@/types/ai";
import { aiPatchProposalSchema, aiRequestSchema } from "@/utils/aiValidationSchemas";

const errorResponse = (requestId: string, code: AiErrorCode, message: string, details: string[] | undefined, status: number) => NextResponse.json<AiApiResponse>({ success: false, error: { code, message, ...(details?.length ? { details } : {}) }, requestId }, { status });

export async function POST(httpRequest: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  let payload: unknown;
  try { payload = await httpRequest.json(); }
  catch { return errorResponse(requestId, "INVALID_REQUEST", "The request body must be valid JSON.", undefined, 400); }
  const requestResult = aiRequestSchema.safeParse(payload);
  if (!requestResult.success) return errorResponse(requestId, "INVALID_REQUEST", "The AI request is invalid.", requestResult.error.issues.map((issue) => `${issue.path.map(String).join(".") || "value"}: ${issue.message}`), 400);
  const timeoutMs = 10_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const provider = getAiProvider();
    const proposal = await provider.generateProposal(requestResult.data, controller.signal);
    const proposalResult = aiPatchProposalSchema.safeParse(proposal);
    if (!proposalResult.success) return errorResponse(requestId, "INVALID_MODEL_OUTPUT", "The provider returned an invalid proposal.", proposalResult.error.issues.map((issue) => issue.message), 502);
    return NextResponse.json<AiApiResponse>({ success: true, proposal: proposalResult.data, provider: provider.name, requestId, durationMs: Math.max(0, Math.round(performance.now() - startedAt)) });
  } catch (reason) {
    if (reason instanceof AiProviderError) return errorResponse(requestId, reason.code, reason.message, reason.details, reason.code === "PROVIDER_UNAVAILABLE" ? 503 : reason.code === "REQUEST_TIMEOUT" ? 504 : 422);
    return errorResponse(requestId, "UNKNOWN_ERROR", reason instanceof Error ? reason.message : "Unknown AI pipeline error.", undefined, 500);
  } finally { clearTimeout(timeout); }
}
