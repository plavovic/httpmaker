import { z } from "zod";
import { sectionTypeSchema, websiteDesignPatchSchema, websiteJSONSchema } from "@/utils/validationSchemas";

export const aiModeSchema = z.enum(["edit-selected-section", "restyle-website", "rewrite-content", "add-section"]);
export const aiRequestSchema = z.object({
  mode: aiModeSchema,
  instruction: z.string().trim().min(2).max(2000),
  website: websiteJSONSchema,
  selectedSectionId: z.string().min(1).optional(),
}).strict().superRefine((value, context) => {
  const requiresSelection = value.mode === "edit-selected-section" || value.mode === "rewrite-content";
  if (requiresSelection && !value.selectedSectionId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["selectedSectionId"], message: "A selected section is required for this AI mode." });
    return;
  }
  if (value.selectedSectionId && !value.website.sections.some((section) => section.id === value.selectedSectionId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["selectedSectionId"], message: "The selected section does not exist in the website." });
  }
});

export const aiChangeScopeSchema = z.enum(["theme", "section", "website"]);
export const aiChangeSummaryItemSchema = z.object({
  scope: aiChangeScopeSchema,
  sectionId: z.string().min(1).optional(),
  sectionType: sectionTypeSchema.optional(),
  title: z.string().min(1),
  changes: z.array(z.string().min(1)),
}).strict();
export const aiPatchProposalSchema = z.object({ patch: websiteDesignPatchSchema, summary: z.array(aiChangeSummaryItemSchema), warnings: z.array(z.string()) }).strict();
export const aiSuccessResponseSchema = z.object({ success: z.literal(true), proposal: aiPatchProposalSchema, provider: z.literal("mock"), requestId: z.string().min(1), durationMs: z.number().finite().nonnegative() }).strict();
export const aiErrorCodeSchema = z.enum(["INVALID_REQUEST", "NO_SELECTED_SECTION", "PROVIDER_UNAVAILABLE", "REQUEST_TIMEOUT", "INVALID_MODEL_OUTPUT", "PATCH_VALIDATION_FAILED", "PERMISSION_VIOLATION", "PATCH_APPLICATION_FAILED", "UNKNOWN_ERROR"]);
export const aiErrorResponseSchema = z.object({ success: z.literal(false), error: z.object({ code: aiErrorCodeSchema, message: z.string().min(1), details: z.array(z.string()).optional() }).strict(), requestId: z.string().min(1) }).strict();
export const aiApiResponseSchema = z.discriminatedUnion("success", [aiSuccessResponseSchema, aiErrorResponseSchema]);
