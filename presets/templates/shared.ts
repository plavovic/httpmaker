import type { DesignPreset } from "@/types/designPreset";
import type { SectionType, WebsiteJSON, WebsiteSection } from "@/types/website";

type Copy = { brand: string; tagline: string; hero: string; intro: string; services: string; contact: string; image: string };

const makeSection = (type: SectionType, index: number, preset: DesignPreset, copy: Copy): WebsiteSection => {
  const primaryLabel = type === "navbar" ? "Explore" : type === "contact" ? "Send enquiry" : "Learn more";
  const secondaryLabel = type === "navbar" ? "Contact" : "Get in touch";

  return {
    id: `${type}-${preset.id}-${index}`,
    type,
    variant: (preset.sectionDefaults[`${type}Variant` as keyof typeof preset.sectionDefaults] ?? "luxury") as WebsiteSection["variant"],
    navbarAppearance: type === "navbar" ? "glass" : undefined,
    navbarScrollBehavior: type === "navbar" ? "sticky" : undefined,
    props: {
      title: type === "navbar" || type === "footer" ? copy.brand : type === "hero" ? copy.hero : type === "about" ? copy.intro : type === "features" ? copy.services : type === "contact" ? copy.contact : type === "carousel" ? "Selected work" : copy.brand,
      subtitle: type === "navbar" ? copy.tagline : type === "footer" ? `${copy.tagline} · © 2026` : type === "contact" ? "Tell us what you are building and we will reply within two working days." : copy.tagline,
      buttonText: primaryLabel,
      secondaryButtonText: secondaryLabel,
      imageUrl: copy.image,
      alignment: "left",
      statLabel: type === "features" ? "Capabilities" : type === "contact" ? "Contact" : "Independent practice",
      statValue: "Since 2014",
      altText: `${copy.brand} project`,
      items: [copy.image, "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"],
      formFields: type === "contact" ? [
        { id: `name-${preset.id}`, label: "Name", type: "text", placeholder: "Your name", required: true },
        { id: `email-${preset.id}`, label: "Email", type: "email", placeholder: "you@example.com", required: true },
        { id: `message-${preset.id}`, label: "Message", type: "textarea", placeholder: "Tell us about your project", required: true },
      ] : undefined,
    },
    elementStyles: {
      buttonText: { buttonStyle: "filled", hoverEffect: "lift" },
      secondaryButtonText: { buttonStyle: "text", hoverEffect: "none" },
    },
    animation: "fade",
    animationSpeed: "normal",
  };
};

export const makeWebsite = (preset: DesignPreset, copy: Copy): WebsiteJSON => ({
  schemaVersion: 1,
  presetId: preset.id,
  isThemeCustomized: false,
  theme: { ...preset.theme },
  sections: (["navbar", "hero", "about", "features", "carousel", "contact", "footer"] as SectionType[]).map((type, index) => makeSection(type, index, preset, copy)),
});
