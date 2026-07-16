import { z } from "zod";
import type { DesignPreset, DesignPresetId } from "@/types/designPreset";
import type { WebsiteDesignPatch } from "@/types/designPatch";
import type { WebsiteJSON } from "@/types/website";

export const designPresetIdSchema = z.enum(["artistic", "analytical", "modern", "professional", "colourful", "monochrome"]);
export const sectionTypeSchema = z.enum(["navbar", "hero", "about", "carousel", "features", "contact", "footer"]);
export const sectionVariantSchema = z.enum(["luxury", "brutalist"]);
export const alignmentSchema = z.enum(["left", "center", "right"]);
export const spacingScaleSchema = z.enum(["compact", "normal", "spacious"]);
export const visualDensitySchema = z.enum(["compact", "balanced", "editorial"]);
export const imageTreatmentSchema = z.enum(["natural", "monochrome", "high-contrast", "soft", "vibrant"]);
export const animationSchema = z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "scale"]);
export const animationSpeedSchema = z.enum(["slow", "normal", "fast"]);

const nonEmptyString = z.string().min(1);
const editableElementKeySchema = z.string().refine(
  (key) => ["title", "subtitle", "buttonText", "secondaryButtonText", "imageUrl", "statLabel", "statValue"].includes(key) || key.startsWith("content."),
  "Invalid editable element key",
);

export const websiteThemeSchema = z.object({
  backgroundColor: nonEmptyString,
  backgroundImageUrl: z.string().optional(),
  backgroundImageFit: z.enum(["cover", "contain"]).optional(),
  surfaceColor: nonEmptyString,
  primaryColor: nonEmptyString,
  secondaryColor: nonEmptyString,
  accentColor: nonEmptyString,
  textColor: nonEmptyString,
  mutedTextColor: nonEmptyString,
  headingFont: nonEmptyString,
  bodyFont: nonEmptyString,
  borderRadius: z.number().finite().min(0).max(200),
  spacingScale: spacingScaleSchema,
  visualDensity: visualDensitySchema,
  imageTreatment: imageTreatmentSchema,
  fontFamily: nonEmptyString.optional(),
}).strict();

export const editableElementStyleSchema = z.object({
  color: nonEmptyString.optional(),
  fontFamily: nonEmptyString.optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  textDecoration: z.enum(["none", "underline"]).optional(),
  textAlign: alignmentSchema.optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  objectFit: z.enum(["cover", "contain"]).optional(),
  widthPercent: z.number().finite().min(10).max(100).optional(),
  offsetX: z.number().finite().min(-2000).max(2000).optional(),
  offsetY: z.number().finite().min(-2000).max(2000).optional(),
  buttonStyle: z.enum(["filled", "outline"]).optional(),
  animation: z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "scale", "float", "pulse"]).optional(),
  animationSpeed: animationSpeedSchema.optional(),
}).strict();

export const websiteSectionPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  secondaryButtonText: z.string(),
  imageUrl: z.string(),
  alignment: alignmentSchema,
  statLabel: z.string(),
  statValue: z.string(),
  altText: z.string().optional(),
  items: z.array(z.string()).optional(),
}).strict();

export const websiteSectionSchema = z.object({
  id: nonEmptyString,
  type: sectionTypeSchema,
  variant: sectionVariantSchema,
  backgroundColor: z.string().optional(),
  props: websiteSectionPropsSchema,
  elementStyles: z.record(editableElementKeySchema, editableElementStyleSchema).optional(),
  elementLinks: z.record(editableElementKeySchema, z.string()).optional(),
  animation: animationSchema.optional(),
  animationSpeed: animationSpeedSchema.optional(),
  content: z.record(z.string(), z.string()).optional(),
}).strict();

export const websiteJSONSchema = z.object({
  presetId: designPresetIdSchema.optional(),
  isThemeCustomized: z.boolean().optional(),
  theme: websiteThemeSchema,
  sections: z.array(websiteSectionSchema).min(1),
}).strict();

const presetSectionDefaultsSchema = z.object({
  navbarVariant: z.string().optional(),
  heroVariant: z.string().optional(),
  aboutVariant: z.string().optional(),
  featuresVariant: z.string().optional(),
  carouselVariant: z.string().optional(),
  contactVariant: z.string().optional(),
  footerVariant: z.string().optional(),
}).strict();

export const designPresetSchema = z.object({
  id: designPresetIdSchema,
  name: nonEmptyString,
  description: z.string(),
  keywords: z.array(z.string()),
  previewImage: z.string().optional(),
  theme: websiteThemeSchema.omit({ fontFamily: true }),
  sectionDefaults: presetSectionDefaultsSchema,
  animationDefaults: z.object({ heading: z.string(), body: z.string(), image: z.string(), button: z.string() }).strict(),
}).strict();

export const websiteDesignPatchSchema = z.object({
  presetId: designPresetIdSchema.optional(),
  theme: websiteThemeSchema.partial().optional(),
  sectionUpdates: z.array(z.object({
    sectionId: nonEmptyString,
    variant: sectionVariantSchema.optional(),
    props: websiteSectionPropsSchema.partial().optional(),
  }).strict()).optional(),
  addSections: z.array(websiteSectionSchema).optional(),
  removeSectionIds: z.array(nonEmptyString).optional(),
}).strict();

export const parseWebsiteJSON = (value: unknown): WebsiteJSON | null => {
  const result = websiteJSONSchema.safeParse(value);
  return result.success ? result.data : null;
};

export const parseWebsiteDesignPatch = (value: unknown): WebsiteDesignPatch | null => {
  const result = websiteDesignPatchSchema.safeParse(value);
  return result.success ? result.data : null;
};

export const parseDesignPreset = (value: unknown): DesignPreset | null => {
  const result = designPresetSchema.safeParse(value);
  return result.success ? result.data : null;
};

// Compile-time checks keep schemas aligned with the domain types.
const _websiteTypeCheck: z.ZodType<WebsiteJSON> = websiteJSONSchema;
const _presetIdTypeCheck: z.ZodType<DesignPresetId> = designPresetIdSchema;
void _websiteTypeCheck;
void _presetIdTypeCheck;
