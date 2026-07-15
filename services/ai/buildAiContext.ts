import { builderCapabilities } from "@/services/ai/builderCapabilities";
import { aiModePermissions } from "@/services/ai/permissions";
import type { AiRequest } from "@/types/ai";
import type { WebsiteSection } from "@/types/website";

export type AiContext = {
  mode: AiRequest["mode"];
  instruction: string;
  selectedSection?: WebsiteSection;
  permissions: typeof aiModePermissions[AiRequest["mode"]];
  capabilities: typeof builderCapabilities;
};

export function buildAiContext(request: AiRequest): AiContext {
  const selectedSection = request.selectedSectionId ? request.website.sections.find((section) => section.id === request.selectedSectionId) : undefined;
  return {
    mode: request.mode,
    instruction: request.instruction,
    selectedSection: selectedSection ? { ...selectedSection, props: { ...selectedSection.props }, content: selectedSection.content ? { ...selectedSection.content } : undefined } : undefined,
    permissions: { ...aiModePermissions[request.mode] },
    capabilities: {
      sectionTypes: Object.fromEntries(Object.entries(builderCapabilities.sectionTypes).map(([type, capability]) => [type, capability ? { variants: [...capability.variants], editableProperties: [...capability.editableProperties], contentProperties: [...capability.contentProperties] } : capability])),
      animations: [...builderCapabilities.animations],
      presets: [...builderCapabilities.presets],
    },
  };
}
