import { z } from "zod";
import { elementLinkMapSchema, elementStyleMapSchema } from "@/schemas/element-style.schema";
import { alignmentSchema, animationSchema, animationSpeedSchema, nonEmptyStringSchema, sectionVariantSchema } from "@/schemas/shared.schema";

export const websiteSectionPropsSchema = z.object({
  title: z.string(), subtitle: z.string(), buttonText: z.string(), secondaryButtonText: z.string(),
  imageUrl: z.string(), alignment: alignmentSchema, statLabel: z.string(), statValue: z.string(),
  altText: z.string().optional(), items: z.array(z.string()).optional(),
}).strict();

const persistedSectionShape = {
  id: nonEmptyStringSchema,
  variant: sectionVariantSchema,
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  backgroundImageFit: z.enum(["cover", "contain"]).optional(),
  navbarAppearance: z.enum(["transparent", "glass", "colored"]).optional(),
  navbarScrollBehavior: z.enum(["sticky", "hide-on-scroll"]).optional(),
  heightVh: z.number().min(25).max(100).optional(),
  props: websiteSectionPropsSchema,
  elementStyles: elementStyleMapSchema.optional(),
  elementLinks: elementLinkMapSchema.optional(),
  animation: animationSchema.optional(),
  animationSpeed: animationSpeedSchema.optional(),
  content: z.record(z.string(), z.string()).optional(),
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
