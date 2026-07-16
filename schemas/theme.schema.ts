import { z } from "zod";
import { imageTreatmentSchema, nonEmptyStringSchema, spacingScaleSchema, visualDensitySchema } from "@/schemas/shared.schema";

export const websiteThemeSchema = z.object({
  backgroundColor: nonEmptyStringSchema,
  backgroundImageUrl: z.string().optional(),
  backgroundImageFit: z.enum(["cover", "contain"]).optional(),
  surfaceColor: nonEmptyStringSchema,
  primaryColor: nonEmptyStringSchema,
  secondaryColor: nonEmptyStringSchema,
  accentColor: nonEmptyStringSchema,
  textColor: nonEmptyStringSchema,
  mutedTextColor: nonEmptyStringSchema,
  headingFont: nonEmptyStringSchema,
  bodyFont: nonEmptyStringSchema,
  borderRadius: z.number().finite().min(0).max(200),
  spacingScale: spacingScaleSchema,
  visualDensity: visualDensitySchema,
  imageTreatment: imageTreatmentSchema,
  fontFamily: nonEmptyStringSchema.optional(),
}).strict();
