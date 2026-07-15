import { designPresets } from "@/presets";
import { sectionCapabilityMetadata, sectionRegistry } from "@/renderer/sectionRegistry";
import type { WebsiteSection } from "@/types/website";
import { animationSchema } from "@/utils/validationSchemas";

export type BuilderSectionCapability = { variants: string[]; editableProperties: string[]; contentProperties: string[] };
export type BuilderCapabilities = { sectionTypes: Partial<Record<WebsiteSection["type"], BuilderSectionCapability>>; animations: string[]; presets: string[] };

export const builderCapabilities: BuilderCapabilities = {
  sectionTypes: sectionCapabilityMetadata,
  animations: [...animationSchema.options],
  presets: Object.keys(designPresets),
};

export function getSectionCapability(sectionType: WebsiteSection["type"]): BuilderSectionCapability | undefined { return builderCapabilities.sectionTypes[sectionType] }
export function isSupportedSectionType(sectionType: string): sectionType is WebsiteSection["type"] { return Object.prototype.hasOwnProperty.call(builderCapabilities.sectionTypes, sectionType) }
export function isSupportedVariant(sectionType: WebsiteSection["type"], variant: string): boolean { return getSectionCapability(sectionType)?.variants.includes(variant) ?? false }
export function isSupportedAnimation(animation: string): boolean { return builderCapabilities.animations.includes(animation) }
export function isEditableProperty(sectionType: WebsiteSection["type"], property: string): boolean { return getSectionCapability(sectionType)?.editableProperties.includes(property) ?? false }
export function isContentProperty(sectionType: WebsiteSection["type"], property: string): boolean { return getSectionCapability(sectionType)?.contentProperties.includes(property) ?? false }

export function validateBuilderCapabilities(): string[] {
  const errors: string[] = [];
  for (const sectionType of Object.keys(sectionRegistry) as WebsiteSection["type"][]) {
    const capability = getSectionCapability(sectionType);
    if (!capability) { errors.push(`Missing capability metadata for ${sectionType}.`); continue; }
    if (new Set(capability.variants).size !== capability.variants.length) errors.push(`Duplicate variants for ${sectionType}.`);
    for (const variant of capability.variants) if (!(variant in sectionRegistry[sectionType])) errors.push(`Unknown variant ${sectionType}.${variant}.`);
    for (const property of capability.contentProperties) if (!capability.editableProperties.includes(property)) errors.push(`${sectionType}.${property} is content-only but not editable.`);
  }
  for (const sectionType of Object.keys(builderCapabilities.sectionTypes)) if (!(sectionType in sectionRegistry)) errors.push(`Capability metadata exists for unregistered section ${sectionType}.`);
  for (const preset of builderCapabilities.presets) if (!(preset in designPresets)) errors.push(`Unknown preset ${preset}.`);
  for (const animation of builderCapabilities.animations) if (!animationSchema.safeParse(animation).success) errors.push(`Unknown animation ${animation}.`);
  return errors;
}
