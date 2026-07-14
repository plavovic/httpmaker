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
