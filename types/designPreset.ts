export type DesignPresetId = "artistic" | "analytical" | "modern" | "professional" | "colourful" | "monochrome";
export type SpacingScale = "compact" | "normal" | "spacious";
export type VisualDensity = "compact" | "balanced" | "editorial";
export type ImageTreatment = "natural" | "monochrome" | "high-contrast" | "soft" | "vibrant";
export type DesignPresetTheme = { backgroundColor:string; surfaceColor:string; primaryColor:string; secondaryColor:string; accentColor:string; textColor:string; mutedTextColor:string; headingFont:string; bodyFont:string; borderRadius:number; spacingScale:SpacingScale; visualDensity:VisualDensity; imageTreatment:ImageTreatment };
export type PresetSectionDefaults = { navbarVariant?:string; heroVariant?:string; aboutVariant?:string; featuresVariant?:string; carouselVariant?:string; contactVariant?:string; footerVariant?:string };
export type PresetAnimationDefaults = { heading:string; body:string; image:string; button:string };
export type DesignPreset = { id:DesignPresetId; name:string; description:string; keywords:string[]; previewImage?:string; theme:DesignPresetTheme; sectionDefaults:PresetSectionDefaults; animationDefaults:PresetAnimationDefaults };
