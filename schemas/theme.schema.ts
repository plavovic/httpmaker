import { z } from "zod";
import { cssColorSchema, imageTreatmentSchema, safeImageUrlSchema, spacingScaleSchema, visualDensitySchema } from "@/schemas/shared.schema";

export const websiteThemeSchema = z.object({
  backgroundColor: cssColorSchema,
  backgroundImageUrl: safeImageUrlSchema.optional(),
  backgroundImageFit: z.enum(["cover", "contain"]).optional(),
  surfaceColor: cssColorSchema,
  primaryColor: cssColorSchema,
  secondaryColor: cssColorSchema,
  accentColor: cssColorSchema,
  textColor: cssColorSchema,
  mutedTextColor: cssColorSchema,
  headingFont: z.string().min(1).max(200),
  bodyFont: z.string().min(1).max(200),
  borderRadius: z.number().finite().min(0).max(200),
  spacingScale: spacingScaleSchema,
  visualDensity: visualDensitySchema,
  imageTreatment: imageTreatmentSchema,
  fontFamily: z.string().min(1).max(200).optional(),
}).strict();
