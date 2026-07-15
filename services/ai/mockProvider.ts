import { applyWebsiteDesignPatchSafely } from "@/services/ai/applyWebsiteDesignPatchSafely";
import { buildAiContext } from "@/services/ai/buildAiContext";
import { AiProviderError, type AiProvider } from "@/services/ai/provider";
import type { AiPatchProposal, AiRequest } from "@/types/ai";
import type { WebsiteDesignPatch } from "@/types/designPatch";
import type { SectionType, WebsiteSection, WebsiteSectionProps } from "@/types/website";

const textAfter = (instruction: string, pattern: RegExp) => instruction.match(pattern)?.[1]?.trim();
const titleFromInstruction = (instruction: string) => textAfter(instruction, /title\s+to\s+(.+)/i) ?? instruction.trim();
const sectionTypeFromInstruction = (instruction: string): SectionType => (["navbar", "hero", "about", "carousel", "features", "contact", "footer"] as const).find((type) => instruction.toLowerCase().includes(type)) ?? "features";
const defaultProps = (instruction: string): WebsiteSectionProps => ({ title: titleFromInstruction(instruction), subtitle: "Created by the deterministic HTTPMAKER mock provider.", buttonText: "Learn more", secondaryButtonText: "Contact us", imageUrl: "", alignment: "left", statLabel: "New section", statValue: "01" });

function uniqueSectionId(request: AiRequest, type: SectionType): string {
  const ids = new Set(request.website.sections.map((section) => section.id));
  let index = 1;
  while (ids.has(`ai-${type}-${index}`)) index += 1;
  return `ai-${type}-${index}`;
}

function createPatch(request: AiRequest): WebsiteDesignPatch {
  const context = buildAiContext(request);
  if (request.mode === "restyle-website") {
    const dark = /dark|black|brutalist/i.test(request.instruction);
    return { theme: dark ? { backgroundColor: "#09090b", surfaceColor: "#18181b", primaryColor: "#facc15", textColor: "#fafafa", mutedTextColor: "#a1a1aa" } : { backgroundColor: "#f8f7fb", surfaceColor: "#ffffff", primaryColor: "#6d4fd0", textColor: "#211d29", mutedTextColor: "#6f6877" } };
  }
  if (request.mode === "add-section") {
    const type = sectionTypeFromInstruction(request.instruction);
    const section: WebsiteSection = { id: uniqueSectionId(request, type), type, variant: /brutalist/i.test(request.instruction) ? "brutalist" : "luxury", props: defaultProps(request.instruction), animation: "fade", animationSpeed: "normal" };
    return { addSections: [section] };
  }
  if (!context.selectedSection) throw new AiProviderError("INVALID_MODEL_OUTPUT", "The selected section is unavailable.");
  if (request.mode === "rewrite-content") return { sectionUpdates: [{ sectionId: context.selectedSection.id, props: { title: titleFromInstruction(request.instruction) } }] };
  const requestedVariant = /brutalist/i.test(request.instruction) ? "brutalist" : /luxury/i.test(request.instruction) ? "luxury" : undefined;
  const subtitle = textAfter(request.instruction, /subtitle\s+to\s+(.+)/i);
  return { sectionUpdates: [{ sectionId: context.selectedSection.id, variant: requestedVariant, props: subtitle ? { subtitle } : { title: titleFromInstruction(request.instruction) } }] };
}

export const mockAiProvider: AiProvider = {
  name: "mock",
  async generateProposal(request, signal): Promise<AiPatchProposal> {
    if (signal?.aborted) throw new AiProviderError("REQUEST_TIMEOUT", "The AI request was aborted.");
    const patch = createPatch(request);
    const result = applyWebsiteDesignPatchSafely({ website: request.website, patch, mode: request.mode, selectedSectionId: request.selectedSectionId });
    if (!result.success) throw new AiProviderError(result.error.code === "PERMISSION_VIOLATION" ? "PERMISSION_VIOLATION" : "PATCH_APPLICATION_FAILED", result.error.message, result.error.details);
    return { patch, summary: result.summary, warnings: result.warnings };
  },
};
