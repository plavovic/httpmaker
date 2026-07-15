import type { AiMode } from "@/types/ai";

export type AiModePermission = { canChangeTheme: boolean; canUpdateSections: boolean; canAddSections: boolean; canRemoveSections: boolean; restrictUpdatesToSelectedSection: boolean; contentOnly: boolean };
export const aiModePermissions = {
  "edit-selected-section": { canChangeTheme: false, canUpdateSections: true, canAddSections: false, canRemoveSections: false, restrictUpdatesToSelectedSection: true, contentOnly: false },
  "restyle-website": { canChangeTheme: true, canUpdateSections: true, canAddSections: false, canRemoveSections: false, restrictUpdatesToSelectedSection: false, contentOnly: false },
  "rewrite-content": { canChangeTheme: false, canUpdateSections: true, canAddSections: false, canRemoveSections: false, restrictUpdatesToSelectedSection: true, contentOnly: true },
  "add-section": { canChangeTheme: false, canUpdateSections: false, canAddSections: true, canRemoveSections: false, restrictUpdatesToSelectedSection: false, contentOnly: false },
} satisfies Record<AiMode, AiModePermission>;
