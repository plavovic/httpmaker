import type { ComponentType } from "react";
import FeaturesBrutalist from "@/components/website-sections/FeaturesBrutalist";
import FeaturesLuxury from "@/components/website-sections/FeaturesLuxury";
import FooterBrutalist from "@/components/website-sections/FooterBrutalist";
import FooterLuxury from "@/components/website-sections/FooterLuxury";
import HeroBrutalist from "@/components/website-sections/HeroBrutalist";
import HeroLuxury from "@/components/website-sections/HeroLuxury";
import NavbarBrutalist from "@/components/website-sections/NavbarBrutalist";
import NavbarLuxury from "@/components/website-sections/NavbarLuxury";
import AboutSection from "@/components/website-sections/AboutSection";
import CarouselSection from "@/components/website-sections/CarouselSection";
import ContactSection from "@/components/website-sections/ContactSection";
import type { SectionType, SectionVariant, WebsiteSectionComponentProps } from "@/types/website";

type SectionRegistry = Record<SectionType, Record<SectionVariant, ComponentType<WebsiteSectionComponentProps>>>;

export const sectionRegistry: SectionRegistry = {
  navbar: { luxury: NavbarLuxury, brutalist: NavbarBrutalist },
  hero: { luxury: HeroLuxury, brutalist: HeroBrutalist },
  about: { luxury: AboutSection, brutalist: AboutSection },
  carousel: { luxury: CarouselSection, brutalist: CarouselSection },
  features: { luxury: FeaturesLuxury, brutalist: FeaturesBrutalist },
  contact: { luxury: ContactSection, brutalist: ContactSection },
  footer: { luxury: FooterLuxury, brutalist: FooterBrutalist },
};

type SectionCapabilityMetadata = { variants: SectionVariant[]; editableProperties: (keyof import("@/types/website").WebsiteSectionProps)[]; contentProperties: (keyof import("@/types/website").WebsiteSectionProps)[] };

// Shared non-React metadata keeps AI capability checks synchronized with renderer registration.
export const sectionCapabilityMetadata = {
  navbar: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "secondaryButtonText", "alignment"], contentProperties: ["title", "subtitle", "buttonText", "secondaryButtonText"] },
  hero: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "secondaryButtonText", "imageUrl", "alignment", "statLabel", "statValue", "altText"], contentProperties: ["title", "subtitle", "buttonText", "secondaryButtonText", "statLabel", "statValue", "altText"] },
  about: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "imageUrl", "statLabel", "statValue", "altText"], contentProperties: ["title", "subtitle", "buttonText", "statLabel", "statValue", "altText"] },
  carousel: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "imageUrl", "statLabel", "altText", "items"], contentProperties: ["title", "subtitle", "statLabel", "altText", "items"] },
  features: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "statLabel"], contentProperties: ["title", "subtitle", "buttonText", "statLabel"] },
  contact: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "statLabel"], contentProperties: ["title", "subtitle", "buttonText", "statLabel"] },
  footer: { variants: ["luxury", "brutalist"], editableProperties: ["title", "subtitle", "buttonText", "secondaryButtonText", "alignment", "statLabel"], contentProperties: ["title", "subtitle", "buttonText", "secondaryButtonText", "statLabel"] },
} satisfies Record<SectionType, SectionCapabilityMetadata>;
