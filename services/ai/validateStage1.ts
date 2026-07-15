import { initialWebsite } from "@/data/initialWebsite";
import { builderCapabilities, isContentProperty, isSupportedAnimation, isSupportedSectionType, isSupportedVariant, validateBuilderCapabilities } from "@/services/ai/builderCapabilities";
import { aiModePermissions } from "@/services/ai/permissions";
import { aiApiResponseSchema, aiRequestSchema } from "@/utils/aiValidationSchemas";

type Check = { name: string; passes: boolean };
const selectedSectionId = initialWebsite.sections[0].id;
const validRequest = { mode: "restyle-website", instruction: "Restyle this website", website: initialWebsite };
const validProposal = { patch: {}, summary: [], warnings: [] };

// Lightweight, framework-free validation for repositories without a test runner.
export function validateAiStage1(): string[] {
  const firstType = initialWebsite.sections[0].type;
  const firstVariant = builderCapabilities.sectionTypes[firstType]?.variants[0] ?? "";
  const checks: Check[] = [
    { name: "valid restyle request", passes: aiRequestSchema.safeParse(validRequest).success },
    { name: "valid selected-section request", passes: aiRequestSchema.safeParse({ ...validRequest, mode: "edit-selected-section", selectedSectionId }).success },
    { name: "missing selected section", passes: !aiRequestSchema.safeParse({ ...validRequest, mode: "rewrite-content" }).success },
    { name: "unknown selected section", passes: !aiRequestSchema.safeParse({ ...validRequest, mode: "rewrite-content", selectedSectionId: "missing" }).success },
    { name: "empty instruction", passes: !aiRequestSchema.safeParse({ ...validRequest, instruction: "  " }).success },
    { name: "one-character instruction", passes: !aiRequestSchema.safeParse({ ...validRequest, instruction: "x" }).success },
    { name: "oversized instruction", passes: !aiRequestSchema.safeParse({ ...validRequest, instruction: "x".repeat(2001) }).success },
    { name: "invalid mode", passes: !aiRequestSchema.safeParse({ ...validRequest, mode: "unknown" }).success },
    { name: "invalid website", passes: !aiRequestSchema.safeParse({ ...validRequest, website: {} }).success },
    { name: "valid success response", passes: aiApiResponseSchema.safeParse({ success: true, proposal: validProposal, provider: "mock", requestId: "request-1", durationMs: 10 }).success },
    { name: "valid error response", passes: aiApiResponseSchema.safeParse({ success: false, error: { code: "INVALID_REQUEST", message: "Invalid request" }, requestId: "request-1" }).success },
    { name: "success requires proposal", passes: !aiApiResponseSchema.safeParse({ success: true, provider: "mock", requestId: "request-1", durationMs: 10 }).success },
    { name: "error requires error object", passes: !aiApiResponseSchema.safeParse({ success: false, requestId: "request-1" }).success },
    { name: "provider is restricted", passes: !aiApiResponseSchema.safeParse({ success: true, proposal: validProposal, provider: "other", requestId: "request-1", durationMs: 10 }).success },
    { name: "all mode permissions exist", passes: Object.keys(aiModePermissions).length === 4 },
    { name: "registered type is supported", passes: isSupportedSectionType(firstType) },
    { name: "unknown type is rejected", passes: !isSupportedSectionType("unknown") },
    { name: "registered variant is supported", passes: isSupportedVariant(firstType, firstVariant) },
    { name: "unknown variant is rejected", passes: !isSupportedVariant(firstType, "unknown") },
    { name: "known animation is supported", passes: isSupportedAnimation("fade") },
    { name: "known content property is supported", passes: isContentProperty(firstType, "title") },
  ];
  return [...checks.filter((check) => !check.passes).map((check) => `Failed: ${check.name}`), ...validateBuilderCapabilities()];
}
