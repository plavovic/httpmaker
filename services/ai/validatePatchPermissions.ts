import { isContentProperty, isEditableProperty, isSupportedSectionType, isSupportedVariant } from "@/services/ai/builderCapabilities";
import { aiModePermissions } from "@/services/ai/permissions";
import type { AiRequest } from "@/types/ai";
import type { WebsiteDesignPatch } from "@/types/designPatch";

export type PatchPermissionResult = { success: true; warnings: string[] } | { success: false; violations: string[] };

export function validatePatchPermissions(request: AiRequest, patch: WebsiteDesignPatch): PatchPermissionResult {
  const permission = aiModePermissions[request.mode];
  const violations: string[] = [];
  const warnings: string[] = [];
  const existingIds = new Set(request.website.sections.map((section) => section.id));
  const addViolation = (path: string, message: string) => violations.push(`${path}: ${message}`);

  if ((patch.theme || patch.presetId) && !permission.canChangeTheme) addViolation("theme", `${request.mode} cannot change the website theme or preset.`);
  if (patch.sectionUpdates?.length && !permission.canUpdateSections) addViolation("sectionUpdates", `${request.mode} cannot update existing sections.`);
  if (patch.addSections?.length && !permission.canAddSections) addViolation("addSections", `${request.mode} cannot add sections.`);
  if (patch.removeSectionIds?.length && !permission.canRemoveSections) addViolation("removeSectionIds", `${request.mode} cannot remove sections.`);

  const seenUpdates = new Set<string>();
  const sectionUpdates = patch.sectionUpdates ?? [];
  for (let index = 0; index < sectionUpdates.length; index += 1) {
    const update = sectionUpdates[index];
    const path = `sectionUpdates.${index}`;
    const section = request.website.sections.find((item) => item.id === update.sectionId);
    if (!section) addViolation(`${path}.sectionId`, `Section ${update.sectionId} does not exist.`);
    if (seenUpdates.has(update.sectionId)) addViolation(`${path}.sectionId`, `Section ${update.sectionId} is updated more than once.`);
    seenUpdates.add(update.sectionId);
    if (permission.restrictUpdatesToSelectedSection && update.sectionId !== request.selectedSectionId) addViolation(`${path}.sectionId`, `Updates are restricted to selected section ${request.selectedSectionId ?? "(none)"}.`);
    if (section && update.variant && !isSupportedVariant(section.type, update.variant)) addViolation(`${path}.variant`, `Variant ${update.variant} is not supported for ${section.type}.`);
    for (const property of Object.keys(update.props ?? {})) {
      if (section && !isEditableProperty(section.type, property)) addViolation(`${path}.props.${property}`, `${property} is not editable for ${section.type}.`);
    }
    if (permission.contentOnly) {
      if (update.variant) addViolation(`${path}.variant`, "Content-only mode cannot change section variants.");
      for (const property of Object.keys(update.props ?? {})) {
        if (section && !isContentProperty(section.type, property)) addViolation(`${path}.props.${property}`, `${property} is not a content property for ${section.type}.`);
      }
    }
  }

  const seenAdditions = new Set<string>();
  const addedSections = patch.addSections ?? [];
  for (let index = 0; index < addedSections.length; index += 1) {
    const section = addedSections[index];
    const path = `addSections.${index}`;
    if (existingIds.has(section.id) || seenAdditions.has(section.id)) addViolation(`${path}.id`, `Section ID ${section.id} is already in use.`);
    seenAdditions.add(section.id);
    if (!isSupportedSectionType(section.type)) addViolation(`${path}.type`, `Section type ${section.type} is not supported.`);
    else if (!isSupportedVariant(section.type, section.variant)) addViolation(`${path}.variant`, `Variant ${section.variant} is not supported for ${section.type}.`);
  }

  const removedSectionIds = patch.removeSectionIds ?? [];
  for (let index = 0; index < removedSectionIds.length; index += 1) {
    const sectionId = removedSectionIds[index];
    if (!existingIds.has(sectionId)) addViolation(`removeSectionIds.${index}`, `Section ${sectionId} does not exist.`);
  }
  if (!patch.theme && !patch.presetId && !patch.sectionUpdates?.length && !patch.addSections?.length && !patch.removeSectionIds?.length) warnings.push("The patch contains no operations.");
  return violations.length ? { success: false, violations } : { success: true, warnings };
}
