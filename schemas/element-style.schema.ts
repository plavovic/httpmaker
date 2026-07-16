import { z } from "zod";
import { alignmentSchema, animationSpeedSchema, editableElementKeySchema, nonEmptyStringSchema } from "@/schemas/shared.schema";

export const editableElementStyleSchema = z.object({
  color: nonEmptyStringSchema.optional(),
  fontFamily: nonEmptyStringSchema.optional(),
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

export const elementStyleMapSchema = z.record(editableElementKeySchema, editableElementStyleSchema);
export const elementLinkMapSchema = z.record(editableElementKeySchema, z.string());
