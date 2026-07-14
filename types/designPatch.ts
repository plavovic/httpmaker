import type { DesignPresetId } from "@/types/designPreset";
import type { WebsiteSection,WebsiteTheme } from "@/types/website";
export type WebsiteDesignPatch={presetId?:DesignPresetId;theme?:Partial<WebsiteTheme>;sectionUpdates?:Array<{sectionId:string;variant?:string;props?:Record<string,unknown>}>;addSections?:WebsiteSection[];removeSectionIds?:string[]};
