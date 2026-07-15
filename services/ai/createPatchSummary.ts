import type { AiChangeSummaryItem } from "@/types/ai";
import type { WebsiteDesignPatch } from "@/types/designPatch";
import type { WebsiteJSON } from "@/types/website";

const displayName = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
const changed = (left: unknown, right: unknown) => JSON.stringify(left) !== JSON.stringify(right);

export function createPatchSummary(website: WebsiteJSON, patch: WebsiteDesignPatch): AiChangeSummaryItem[] {
  const summary: AiChangeSummaryItem[] = [];
  const themeChanges = Object.entries(patch.theme ?? {}).filter(([key, value]) => changed(website.theme[key as keyof WebsiteJSON["theme"]], value)).map(([key]) => `Change ${displayName(key)}`);
  if (patch.presetId && patch.presetId !== website.presetId) themeChanges.push(`Apply ${displayName(patch.presetId)} preset`);
  if (themeChanges.length) summary.push({ scope: "theme", title: "Update website theme", changes: themeChanges.sort() });

  for (const update of [...(patch.sectionUpdates ?? [])].sort((left, right) => left.sectionId.localeCompare(right.sectionId))) {
    const section = website.sections.find((item) => item.id === update.sectionId);
    if (!section) continue;
    const changes = Object.entries(update.props ?? {}).filter(([key, value]) => changed(section.props[key as keyof typeof section.props], value)).map(([key]) => `Change ${displayName(key)}`);
    if (update.variant && update.variant !== section.variant) changes.push(`Change variant to ${update.variant}`);
    if (changes.length) summary.push({ scope: "section", sectionId: section.id, sectionType: section.type, title: `Update ${displayName(section.type)} section`, changes: changes.sort() });
  }
  for (const section of [...(patch.addSections ?? [])].sort((left, right) => left.id.localeCompare(right.id))) summary.push({ scope: "website", sectionId: section.id, sectionType: section.type, title: `Add ${displayName(section.type)} section`, changes: [`Add section ${section.id}`] });
  for (const sectionId of [...(patch.removeSectionIds ?? [])].sort()) {
    const section = website.sections.find((item) => item.id === sectionId);
    if (section) summary.push({ scope: "website", sectionId, sectionType: section.type, title: `Remove ${displayName(section.type)} section`, changes: [`Remove section ${sectionId}`] });
  }
  return summary;
}

export function createPatchWarnings(website: WebsiteJSON, patch: WebsiteDesignPatch): string[] {
  const warnings: string[] = [];
  const remaining = website.sections.length - new Set(patch.removeSectionIds ?? []).size + (patch.addSections?.length ?? 0);
  if (remaining === 0) warnings.push("The patch would leave the website without sections.");
  if (createPatchSummary(website, patch).length === 0) warnings.push("The patch does not change the website.");
  return warnings;
}
