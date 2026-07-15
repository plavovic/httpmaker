import type { DesignPresetId } from "@/types/designPreset";
import type { SectionVariant, WebsiteSection, WebsiteSectionProps, WebsiteTheme } from "@/types/website";
export type WebsiteDesignPatch={presetId?:DesignPresetId;theme?:Partial<WebsiteTheme>;sectionUpdates?:Array<{sectionId:string;variant?:SectionVariant;props?:Partial<WebsiteSectionProps>}>;addSections?:WebsiteSection[];removeSectionIds?:string[]};
