import type { AiPatchProposal, AiProviderName, AiRequest } from "@/types/ai";

export interface AiProvider {
  readonly name: AiProviderName;
  generateProposal(request: AiRequest, signal?: AbortSignal): Promise<AiPatchProposal>;
}

export class AiProviderError extends Error {
  constructor(public readonly code: "PROVIDER_UNAVAILABLE" | "REQUEST_TIMEOUT" | "INVALID_MODEL_OUTPUT" | "PERMISSION_VIOLATION" | "PATCH_APPLICATION_FAILED", message: string, public readonly details: string[] = []) {
    super(message);
    this.name = "AiProviderError";
  }
}
