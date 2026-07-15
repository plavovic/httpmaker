import { isContentProperty, isSupportedSectionType, isSupportedVariant } from "@/services/ai/builderCapabilities";
import { aiModePermissions } from "@/services/ai/permissions";
import type { AiMode } from "@/types/ai";
import type { WebsiteDesignPatch } from "@/types/designPatch";
import type { WebsiteJSON } from "@/types/website";

export type PatchPermissionViolation = { path: string; message: string };
export type PatchPermissionResult = { success: true } | { success: false; violations: PatchPermissionViolation[] };
export type ValidatePatchPermissionsInput = { mode: AiMode; website: WebsiteJSON; patch: WebsiteDesignPatch; selectedSectionId?: string };

export function validatePatchPermissions({ mode, website, patch, selectedSectionId }: ValidatePatchPermissionsInput): PatchPermissionResult {
  const permission = aiModePermissions[mode];
  const violations: PatchPermissionViolation[] = [];
  const existingIds = new Set(website.sections.map((section) => section.id));

  if ((patch.theme || patch.presetId) && !permission.canChangeTheme) violations.push({ path: "theme", message: `${mode} cannot change the website theme or preset.` });
  if (patch.sectionUpdates?.length && !permission.canUpdateSections) violations.push({ path: "sectionUpdates", message: `${mode} cannot update existing sections.` });
  if (patch.addSections?.length && !permission.canAddSections) violations.push({ path: "addSections", message: `${mode} cannot add sections.` });
  if (patch.removeSectionIds?.length && !permission.canRemoveSections) violations.push({ path: "removeSectionIds", message: `${mode} cannot remove sections.` });

  const seenUpdates = new Set<string>();
  const sectionUpdates = patch.sectionUpdates ?? [];
  for (let index = 0; index < sectionUpdates.length; index += 1) {
    const update = sectionUpdates[index];
    const path = `sectionUpdates.${index}`;
    const section = website.sections.find((item) => item.id === update.sectionId);
    if (!section) violations.push({ path: `${path}.sectionId`, message: `Section ${update.sectionId} does not exist.` });
    if (seenUpdates.has(update.sectionId)) violations.push({ path: `${path}.sectionId`, message: `Section ${update.sectionId} is updated more than once.` });
    seenUpdates.add(update.sectionId);
    if (permission.restrictUpdatesToSelectedSection && update.sectionId !== selectedSectionId) violations.push({ path: `${path}.sectionId`, message: `Updates are restricted to selected section ${selectedSectionId ?? "(none)"}.` });
    if (section && update.variant && !isSupportedVariant(section.type, update.variant)) violations.push({ path: `${path}.variant`, message: `Variant ${update.variant} is not supported for ${section.type}.` });
    if (permission.contentOnly) {
      if (update.variant) violations.push({ path: `${path}.variant`, message: "Content-only mode cannot change section variants." });
      for (const property of Object.keys(update.props ?? {})) {
        if (section && !isContentProperty(section.type, property)) violations.push({ path: `${path}.props.${property}`, message: `${property} is not a content property for ${section.type}.` });
      }
    }
  }

  const seenAdditions = new Set<string>();
  const addedSections = patch.addSections ?? [];
  for (let index = 0; index < addedSections.length; index += 1) {
    const section = addedSections[index];
    const path = `addSections.${index}`;
    if (existingIds.has(section.id) || seenAdditions.has(section.id)) violations.push({ path: `${path}.id`, message: `Section ID ${section.id} is already in use.` });
    seenAdditions.add(section.id);
    if (!isSupportedSectionType(section.type)) violations.push({ path: `${path}.type`, message: `Section type ${section.type} is not supported.` });
    else if (!isSupportedVariant(section.type, section.variant)) violations.push({ path: `${path}.variant`, message: `Variant ${section.variant} is not supported for ${section.type}.` });
  }

  const removedSectionIds = patch.removeSectionIds ?? [];
  for (let index = 0; index < removedSectionIds.length; index += 1) {
    const sectionId = removedSectionIds[index];
    if (!existingIds.has(sectionId)) violations.push({ path: `removeSectionIds.${index}`, message: `Section ${sectionId} does not exist.` });
  }
  return violations.length ? { success: false, violations } : { success: true };
}
