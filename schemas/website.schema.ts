import { z } from "zod";
import { websiteSectionSchema } from "@/schemas/section.schema";
import { designPresetIdSchema } from "@/schemas/shared.schema";
import { websiteThemeSchema } from "@/schemas/theme.schema";
import type { WebsiteJSON } from "@/types/website";

export const CURRENT_WEBSITE_SCHEMA_VERSION = 1 as const;

export const websiteSchema = z.object({
  schemaVersion: z.literal(CURRENT_WEBSITE_SCHEMA_VERSION),
  presetId: designPresetIdSchema.optional(),
  isThemeCustomized: z.boolean().optional(),
  theme: websiteThemeSchema,
  sections: z.array(websiteSectionSchema).min(1),
}).strict();

export const safelyParseWebsiteData = (input: unknown) => websiteSchema.safeParse(input);
export const parseWebsiteData = (input: unknown): WebsiteJSON => websiteSchema.parse(input);

// Versionless documents are the only legacy persisted shape supported in Phase 1.
export function upgradeLegacyWebsiteData(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input) || "schemaVersion" in input) return input;
  return { ...input, schemaVersion: CURRENT_WEBSITE_SCHEMA_VERSION };
}

const _websiteTypeCheck: z.ZodType<WebsiteJSON> = websiteSchema;
void _websiteTypeCheck;
