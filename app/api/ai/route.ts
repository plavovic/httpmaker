import { NextResponse } from "next/server";
import { getAiProvider } from "@/services/ai/getAiProvider";
import { AiProviderError } from "@/services/ai/provider";
import { createPatchSummary, createPatchWarnings } from "@/services/ai/createPatchSummary";
import { validatePatchPermissions } from "@/services/ai/validatePatchPermissions";
import type { AiApiResponse, AiErrorCode } from "@/types/ai";
import { aiPatchProposalSchema, aiRequestSchema } from "@/utils/aiValidationSchemas";
import { auth } from "@/auth";
import { aiRateLimiter } from "@/lib/server/rate-limit";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";

const errorResponse = (requestId: string, code: AiErrorCode, message: string, details: string[] | undefined, status: number) => NextResponse.json<AiApiResponse>({ success: false, error: { code, message, ...(details?.length ? { details } : {}) }, requestId }, { status });

export async function POST(httpRequest: Request) {
  const requestId = crypto.randomUUID();
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return errorResponse(requestId, "INVALID_REQUEST", "Unauthorized.", undefined, 401);
  const rateLimit = await aiRateLimiter.consume(ownerId);
  if (!rateLimit.allowed) return NextResponse.json({ success: false, error: { code: "INVALID_REQUEST", message: "Too many AI requests. Try again shortly." }, requestId }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const startedAt = performance.now();
  let payload: unknown;
  try { payload = await readJsonBody(httpRequest, 1_000_000); }
  catch (error) { const response = jsonBodyError(error); return errorResponse(requestId, "INVALID_REQUEST", (await response.json()).error, undefined, response.status); }
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
    const permissionResult = validatePatchPermissions(requestResult.data, proposalResult.data.patch);
    if (!permissionResult.success) return errorResponse(requestId, "PERMISSION_VIOLATION", "The provider proposal exceeds the requested AI mode's permissions.", permissionResult.violations, 422);
    const serverProposal = {
      patch: proposalResult.data.patch,
      summary: createPatchSummary(requestResult.data.website, proposalResult.data.patch),
      warnings: [...permissionResult.warnings, ...createPatchWarnings(requestResult.data.website, proposalResult.data.patch)],
    };
    return NextResponse.json<AiApiResponse>({ success: true, proposal: serverProposal, provider: provider.name, requestId, durationMs: Math.max(0, Math.round(performance.now() - startedAt)) });
  } catch (reason) {
    if (reason instanceof AiProviderError) return errorResponse(requestId, reason.code, reason.message, reason.details, reason.code === "PROVIDER_UNAVAILABLE" ? 503 : reason.code === "REQUEST_TIMEOUT" ? 504 : 422);
    console.error("AI pipeline failed:", reason);
    return errorResponse(requestId, "UNKNOWN_ERROR", "The AI proposal could not be generated.", undefined, 500);
  } finally { clearTimeout(timeout); }
}
