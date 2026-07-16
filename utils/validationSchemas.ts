import { z } from "zod";
import type { DesignPreset, DesignPresetId } from "@/types/designPreset";
import type { WebsiteDesignPatch } from "@/types/designPatch";
import type { WebsiteJSON } from "@/types/website";
import { websiteSectionPropsSchema, websiteSectionSchema } from "@/schemas/section.schema";
import {
  alignmentSchema, animationSchema, animationSpeedSchema, designPresetIdSchema,
  imageTreatmentSchema, nonEmptyStringSchema, sectionTypeSchema, sectionVariantSchema,
  spacingScaleSchema, visualDensitySchema,
} from "@/schemas/shared.schema";
import { editableElementStyleSchema } from "@/schemas/element-style.schema";
import { websiteThemeSchema } from "@/schemas/theme.schema";
import { safelyParseWebsiteData, websiteSchema } from "@/schemas/website.schema";

export {
  alignmentSchema, animationSchema, animationSpeedSchema, designPresetIdSchema,
  editableElementStyleSchema, imageTreatmentSchema, sectionTypeSchema, sectionVariantSchema,
  spacingScaleSchema, visualDensitySchema, websiteSectionPropsSchema, websiteSectionSchema,
  websiteThemeSchema,
};

// Compatibility alias for existing AI validation imports.
export const websiteJSONSchema = websiteSchema;

const presetSectionDefaultsSchema = z.object({
  navbarVariant: z.string().optional(), heroVariant: z.string().optional(), aboutVariant: z.string().optional(),
  featuresVariant: z.string().optional(), carouselVariant: z.string().optional(), contactVariant: z.string().optional(),
  footerVariant: z.string().optional(),
}).strict();

export const designPresetSchema = z.object({
  id: designPresetIdSchema,
  name: nonEmptyStringSchema,
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
    sectionId: nonEmptyStringSchema,
    variant: sectionVariantSchema.optional(),
    props: websiteSectionPropsSchema.partial().optional(),
  }).strict()).optional(),
  addSections: z.array(websiteSectionSchema).optional(),
  removeSectionIds: z.array(nonEmptyStringSchema).optional(),
}).strict();

export const parseWebsiteJSON = (value: unknown): WebsiteJSON | null => {
  const result = safelyParseWebsiteData(value);
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

const _websiteTypeCheck: z.ZodType<WebsiteJSON> = websiteJSONSchema;
const _presetIdTypeCheck: z.ZodType<DesignPresetId> = designPresetIdSchema;
void _websiteTypeCheck;
void _presetIdTypeCheck;
