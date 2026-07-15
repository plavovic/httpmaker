import { createPatchSummary, createPatchWarnings } from "@/services/ai/createPatchSummary";
import { validatePatchPermissions } from "@/services/ai/validatePatchPermissions";
import type { AiChangeSummaryItem, AiErrorCode, AiMode } from "@/types/ai";
import type { WebsiteJSON } from "@/types/website";
import { applyWebsiteDesignPatch } from "@/utils/applyWebsiteDesignPatch";
import { websiteDesignPatchSchema, websiteJSONSchema } from "@/utils/validationSchemas";

export type SafePatchApplicationError = { code: Extract<AiErrorCode, "PATCH_VALIDATION_FAILED" | "PERMISSION_VIOLATION" | "PATCH_APPLICATION_FAILED">; message: string; details: string[] };
export type SafePatchApplicationResult =
  | { success: true; website: WebsiteJSON; summary: AiChangeSummaryItem[]; warnings: string[] }
  | { success: false; error: SafePatchApplicationError };
export type SafePatchApplicationInput = { website: unknown; patch: unknown; mode: AiMode; selectedSectionId?: string };

const issueDetails = (issues: { path: PropertyKey[]; message: string }[]) => issues.map((issue) => `${issue.path.map(String).join(".") || "value"}: ${issue.message}`);

export function applyWebsiteDesignPatchSafely(input: SafePatchApplicationInput): SafePatchApplicationResult {
  const websiteResult = websiteJSONSchema.safeParse(input.website);
  if (!websiteResult.success) return { success: false, error: { code: "PATCH_VALIDATION_FAILED", message: "The source website is invalid.", details: issueDetails(websiteResult.error.issues) } };
  const patchResult = websiteDesignPatchSchema.safeParse(input.patch);
  if (!patchResult.success) return { success: false, error: { code: "PATCH_VALIDATION_FAILED", message: "The website patch is invalid.", details: issueDetails(patchResult.error.issues) } };
  const permissionResult = validatePatchPermissions({ mode: input.mode, instruction: "Apply validated website patch", website: websiteResult.data, selectedSectionId: input.selectedSectionId }, patchResult.data);
  if (!permissionResult.success) return { success: false, error: { code: "PERMISSION_VIOLATION", message: "The patch exceeds this AI mode's permissions.", details: permissionResult.violations } };
  try {
    const website = applyWebsiteDesignPatch(websiteResult.data, patchResult.data);
    const outputResult = websiteJSONSchema.safeParse(website);
    if (!outputResult.success) return { success: false, error: { code: "PATCH_APPLICATION_FAILED", message: "The patch produced an invalid website.", details: issueDetails(outputResult.error.issues) } };
    return { success: true, website: outputResult.data, summary: createPatchSummary(websiteResult.data, patchResult.data), warnings: [...permissionResult.warnings, ...createPatchWarnings(websiteResult.data, patchResult.data)] };
  } catch (reason) {
    return { success: false, error: { code: "PATCH_APPLICATION_FAILED", message: "The patch could not be applied.", details: [reason instanceof Error ? reason.message : "Unknown patch application error."] } };
  }
}
