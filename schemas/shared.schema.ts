import { z } from "zod";

export const nonEmptyStringSchema = z.string().min(1);
export const designPresetIdSchema = z.enum(["artistic", "analytical", "modern", "professional", "colourful", "monochrome"]);
export const sectionTypeSchema = z.enum(["navbar", "hero", "about", "carousel", "features", "contact", "footer"]);
export const sectionVariantSchema = z.enum(["luxury", "brutalist"]);
export const alignmentSchema = z.enum(["left", "center", "right"]);
export const spacingScaleSchema = z.enum(["compact", "normal", "spacious"]);
export const visualDensitySchema = z.enum(["compact", "balanced", "editorial"]);
export const imageTreatmentSchema = z.enum(["natural", "monochrome", "high-contrast", "soft", "vibrant"]);
export const animationSchema = z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "scale"]);
export const animationSpeedSchema = z.enum(["slow", "normal", "fast"]);

export const editableElementKeySchema = z.string().refine(
  (key) => ["title", "subtitle", "buttonText", "secondaryButtonText", "imageUrl", "statLabel", "statValue"].includes(key) || key.startsWith("content."),
  "Invalid editable element key",
);
