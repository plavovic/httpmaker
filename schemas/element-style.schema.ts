import { z } from "zod";
import { alignmentSchema, animationSpeedSchema, boundedStringSchema, cssColorSchema, editableElementKeySchema, nonEmptyStringSchema, safeExternalUrlSchema } from "@/schemas/shared.schema";

export const editableElementStyleSchema = z.object({
  color: cssColorSchema.optional(),
  fontFamily: z.string().min(1).max(200).optional(),
  fontSize: z.string().max(40).optional(),
  fontWeight: z.string().max(40).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  textDecoration: z.enum(["none", "underline"]).optional(),
  textAlign: alignmentSchema.optional(),
  lineHeight: z.string().max(40).optional(),
  letterSpacing: z.string().max(40).optional(),
  objectFit: z.enum(["cover", "contain"]).optional(),
  widthPercent: z.number().finite().min(10).max(100).optional(),
  heightPx: z.number().finite().min(16).max(2000).optional(),
  offsetX: z.number().finite().min(-2000).max(2000).optional(),
  offsetY: z.number().finite().min(-2000).max(2000).optional(),
  offsetXPercent: z.number().finite().min(-1000).max(1000).optional(),
  offsetYPercent: z.number().finite().min(-1000).max(1000).optional(),
  hiddenInPreview: z.boolean().optional(),
  buttonStyle: z.enum(["filled", "outline", "text"]).optional(),
  backgroundColor: cssColorSchema.optional(),
  borderColor: cssColorSchema.optional(),
  borderRadius: z.number().finite().min(0).max(100).optional(),
  hoverEffect: z.enum(["none", "glow", "lift", "scale", "invert"]).optional(),
  hoverColor: cssColorSchema.optional(),
  hoverTextColor: cssColorSchema.optional(),
  animation: z.enum(["none", "fade", "slide-up", "slide-left", "slide-right", "scale", "float", "pulse"]).optional(),
  animationSpeed: animationSpeedSchema.optional(),
}).strict();

export const elementStyleMapSchema = z.record(editableElementKeySchema, editableElementStyleSchema);
export const elementLinkMapSchema = z.record(editableElementKeySchema, safeExternalUrlSchema);
