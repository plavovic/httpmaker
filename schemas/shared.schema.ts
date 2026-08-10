import { z } from "zod";

export const MAX_TEXT_LENGTH = 5_000;
export const nonEmptyStringSchema = z.string().min(1).max(MAX_TEXT_LENGTH);
export const boundedStringSchema = z.string().max(MAX_TEXT_LENGTH);

const CSS_COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([^\r\n]{1,100}\)|var\(--[a-z0-9_-]{1,80}\)|transparent|currentColor|black|white)$/i;
export const cssColorSchema = z.string().trim().min(1).max(120).regex(CSS_COLOR, "Enter a supported CSS color value.");

export const safeImageUrlSchema = z.string().max(2_000).refine((value) => {
  if (value === "" || value.startsWith("asset://")) return true;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value)) return value.length <= 15_000_000;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Image URLs must use HTTPS (legacy asset:// references are also supported)." );

export const safeExternalUrlSchema = z.string().max(2_000).refine((value) => {
  if (value === "" || value.startsWith("#")) return true;
  try { return ["https:", "mailto:", "tel:"].includes(new URL(value).protocol); } catch { return false; }
}, "URL protocol is not supported.");
export const designPresetIdSchema = z.enum(["artistic", "analytical", "modern", "professional", "colourful", "monochrome"]);
export const sectionTypeSchema = z.enum(["navbar", "hero", "about", "carousel", "features", "contact", "footer"]);
export const sectionVariantSchema = z.enum(["luxury", "brutalist"]);
export const alignmentSchema = z.enum(["left", "center", "right"]);
export const spacingScaleSchema = z.enum(["compact", "normal", "spacious"]);
export const visualDensitySchema = z.enum(["compact", "balanced", "editorial"]);
export const imageTreatmentSchema = z.enum(["natural", "monochrome", "high-contrast", "soft", "vibrant"]);
export const animationSchema = z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "scale"]);
export const animationSpeedSchema = z.enum(["slow", "normal", "fast"]);

export const editableElementKeySchema = z.string().max(160).refine(
  (key) => ["title", "subtitle", "buttonText", "secondaryButtonText", "imageUrl", "mapEmbedUrl", "statLabel", "statValue"].includes(key) || key.startsWith("content."),
  "Invalid editable element key",
);
