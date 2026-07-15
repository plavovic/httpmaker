import type { WebsiteJSON, WebsiteSection } from "@/types/website";
import type { WebsiteDesignPatch } from "@/types/designPatch";

export type AiMode = "edit-selected-section" | "restyle-website" | "rewrite-content" | "add-section";
export type AiRequest = { mode: AiMode; instruction: string; website: WebsiteJSON; selectedSectionId?: string };
export type AiChangeScope = "theme" | "section" | "website";
export type AiChangeSummaryItem = { scope: AiChangeScope; sectionId?: string; sectionType?: WebsiteSection["type"]; title: string; changes: string[] };
export type AiPatchProposal = { patch: WebsiteDesignPatch; summary: AiChangeSummaryItem[]; warnings: string[] };
export type AiProviderName = "mock";
export type AiSuccessResponse = { success: true; proposal: AiPatchProposal; provider: AiProviderName; requestId: string; durationMs: number };
export type AiErrorCode = "INVALID_REQUEST" | "NO_SELECTED_SECTION" | "PROVIDER_UNAVAILABLE" | "REQUEST_TIMEOUT" | "INVALID_MODEL_OUTPUT" | "PATCH_VALIDATION_FAILED" | "PERMISSION_VIOLATION" | "PATCH_APPLICATION_FAILED" | "UNKNOWN_ERROR";
export type AiErrorResponse = { success: false; error: { code: AiErrorCode; message: string; details?: string[] }; requestId: string };
export type AiApiResponse = AiSuccessResponse | AiErrorResponse;
