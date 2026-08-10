import { z } from "zod";
import { elementLinkMapSchema, elementStyleMapSchema } from "@/schemas/element-style.schema";
import { alignmentSchema, animationSchema, animationSpeedSchema, boundedStringSchema, cssColorSchema, nonEmptyStringSchema, safeImageUrlSchema, sectionVariantSchema } from "@/schemas/shared.schema";

export const websiteSectionPropsSchema = z.object({
  title: boundedStringSchema, subtitle: boundedStringSchema, buttonText: boundedStringSchema, secondaryButtonText: boundedStringSchema,
  imageUrl: safeImageUrlSchema, alignment: alignmentSchema, statLabel: boundedStringSchema, statValue: boundedStringSchema,
  altText: boundedStringSchema.optional(), items: z.array(safeImageUrlSchema).max(50).optional(),
  formFields: z.array(z.object({
    id: nonEmptyStringSchema,
    label: boundedStringSchema,
    type: z.enum(["text", "email", "tel", "textarea"]),
    placeholder: boundedStringSchema,
    required: z.boolean(),
  }).strict()).max(20).optional(),
  mapEmbedUrl: safeImageUrlSchema.optional(),
}).strict();

const persistedSectionShape = {
  id: nonEmptyStringSchema,
  variant: sectionVariantSchema,
  backgroundColor: cssColorSchema.optional(),
  backgroundImageUrl: safeImageUrlSchema.optional(),
  backgroundImageFit: z.enum(["cover", "contain"]).optional(),
  navbarAppearance: z.enum(["transparent", "glass", "colored"]).optional(),
  navbarScrollBehavior: z.enum(["sticky", "hide-on-scroll"]).optional(),
  heightVh: z.number().min(25).max(100).optional(),
  props: websiteSectionPropsSchema,
  elementStyles: elementStyleMapSchema.optional(),
  elementLinks: elementLinkMapSchema.optional(),
  animation: animationSchema.optional(),
  animationSpeed: animationSpeedSchema.optional(),
  content: z.record(z.string().max(160), boundedStringSchema).refine((value) => Object.keys(value).length <= 100, "Content contains too many entries.").optional(),
};

const sectionSchema = <T extends string>(type: T) => z.object({ type: z.literal(type), ...persistedSectionShape }).strict();
export const navbarSectionSchema = sectionSchema("navbar");
export const heroSectionSchema = sectionSchema("hero");
export const aboutSectionSchema = sectionSchema("about");
export const carouselSectionSchema = sectionSchema("carousel");
export const featuresSectionSchema = sectionSchema("features");
export const contactSectionSchema = sectionSchema("contact");
export const footerSectionSchema = sectionSchema("footer");

export const websiteSectionSchema = z.discriminatedUnion("type", [
  navbarSectionSchema, heroSectionSchema, aboutSectionSchema, carouselSectionSchema,
  featuresSectionSchema, contactSectionSchema, footerSectionSchema,
]);
