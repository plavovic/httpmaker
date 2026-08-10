import { z } from "zod";

export const MAX_TEXT_LENGTH = 5_000;
export const nonEmptyStringSchema = z.string().min(1).max(MAX_TEXT_LENGTH);
export const boundedStringSchema = z.string().max(MAX_TEXT_LENGTH);

const COLOR_KEYWORDS = new Set(["transparent", "currentcolor", "black", "white"]);
const channel = (value: string) => value.endsWith("%") ? Number(value.slice(0, -1)) >= 0 && Number(value.slice(0, -1)) <= 100 : Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 255;
const alpha = (value: string) => value.endsWith("%") ? Number(value.slice(0, -1)) >= 0 && Number(value.slice(0, -1)) <= 100 : Number(value) >= 0 && Number(value) <= 1;

export function isSupportedCssColor(input: string) {
  const value = input.trim();
  if (/^#[0-9a-f]{3}(?:[0-9a-f]{1}|[0-9a-f]{3}|[0-9a-f]{5})?$/i.test(value)) return true;
  if (COLOR_KEYWORDS.has(value.toLowerCase())) return true;
  if (/^var\(--(?:httpmaker|theme|color)-[a-z0-9_-]{1,64}\)$/i.test(value)) return true;
  const rgb = value.match(/^rgba?\(\s*(\d{1,3}(?:\.\d+)?%?)\s*,\s*(\d{1,3}(?:\.\d+)?%?)\s*,\s*(\d{1,3}(?:\.\d+)?%?)(?:\s*,\s*([0-9.]+%?))?\s*\)$/i);
  if (rgb) return channel(rgb[1]) && channel(rgb[2]) && channel(rgb[3]) && (rgb[4] === undefined || alpha(rgb[4])) && (value.toLowerCase().startsWith("rgba") ? rgb[4] !== undefined : rgb[4] === undefined);
  const hsl = value.match(/^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%(?:\s*,\s*([0-9.]+%?))?\s*\)$/i);
  if (hsl) return Number.isFinite(Number(hsl[1])) && Number(hsl[2]) <= 100 && Number(hsl[3]) <= 100 && (hsl[4] === undefined || alpha(hsl[4])) && (value.toLowerCase().startsWith("hsla") ? hsl[4] !== undefined : hsl[4] === undefined);
  return false;
}

export const cssColorSchema = z.string().trim().min(1).max(120).refine(isSupportedCssColor, "Enter a supported CSS color value.");

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
