import type { DesignPreset, DesignPresetId, DesignPresetTheme } from "@/types/designPreset";
const sectionDefaults = { navbarVariant:"luxury", heroVariant:"luxury", aboutVariant:"luxury", featuresVariant:"luxury", carouselVariant:"luxury", contactVariant:"luxury", footerVariant:"luxury" };
const animationDefaults = { heading:"slide-up", body:"fade", image:"scale", button:"fade" };
export function preset(id:DesignPresetId,name:string,description:string,keywords:string[],theme:DesignPresetTheme,variant:"luxury"|"brutalist"="luxury"):DesignPreset { return { id,name,description,keywords,theme,sectionDefaults:Object.fromEntries(Object.keys(sectionDefaults).map(key=>[key,variant])) as typeof sectionDefaults,animationDefaults }; }
