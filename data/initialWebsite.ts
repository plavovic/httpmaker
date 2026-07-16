import { parseWebsiteData } from "@/schemas/website.schema";

const initialWebsiteData = {
  schemaVersion: 1,
  presetId: "artistic",
  isThemeCustomized: false,
  theme: {
    backgroundColor: "#f7f0e7",
    surfaceColor: "#fffaf3",
    primaryColor: "#111111",
    secondaryColor: "#8b5e3c",
    accentColor: "#b4533c",
    textColor: "#111111",
    mutedTextColor: "#6f665d",
    headingFont: "Georgia",
    bodyFont: "Inter",
    borderRadius: 24,
    spacingScale: "spacious",
    visualDensity: "editorial",
    imageTreatment: "natural",
  },
  sections: [
    {
      id: "nav-1",
      type: "navbar",
      variant: "luxury",
      props: {
        title: "HTTPMAKER",
        subtitle: "AI website builder",
        buttonText: "Launch",
        secondaryButtonText: "Book a demo",
        imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
        alignment: "left",
        statLabel: "Ships in days",
        statValue: "48h",
      },
    },
    {
      id: "hero-1",
      type: "hero",
      variant: "luxury",
      props: {
        title: "Design with a quiet confidence.",
        subtitle: "Launch polished digital experiences with a premium AI workflow built for modern founders.",
        buttonText: "Build your site",
        secondaryButtonText: "View inspiration",
        imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1000&q=80",
        alignment: "left",
        statLabel: "Active clients",
        statValue: "120+",
      },
    },
    {
      id: "about-1", type: "about", variant: "luxury",
      props: { title: "Strategy meets exceptional craft.", subtitle: "We partner with ambitious teams to turn complex ideas into clear, useful digital products.", buttonText: "Our approach", secondaryButtonText: "Meet the team", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80", alignment: "left", statLabel: "About Northstar", statValue: "12 years", altText: "Creative team collaborating" },
      animation: "fade", animationSpeed: "normal",
    },
    {
      id: "carousel-1", type: "carousel", variant: "luxury",
      props: { title: "Work that moves businesses forward.", subtitle: "Selected partnerships across technology, culture, and commerce.", buttonText: "Previous", secondaryButtonText: "Next", imageUrl: "", alignment: "center", statLabel: "Case studies", statValue: "03" },
      animation: "slide-up", animationSpeed: "normal",
    },
    {
      id: "features-1",
      type: "features",
      variant: "luxury",
      props: {
        title: "Built for speed and detail.",
        subtitle: "Every component is crafted for clarity, motion, and a handcrafted finish.",
        buttonText: "See the system",
        secondaryButtonText: "Talk to us",
        imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80",
        alignment: "center",
        statLabel: "Focus",
        statValue: "Zero friction",
      },
    },
    {
      id: "contact-1", type: "contact", variant: "luxury",
      props: { title: "Let’s build something useful.", subtitle: "Share your challenge and we’ll reply within two business days.", buttonText: "Send inquiry", secondaryButtonText: "Book a call", imageUrl: "", alignment: "left", statLabel: "Start a project", statValue: "48h" },
      animation: "fade", animationSpeed: "normal",
    },
    {
      id: "footer-1",
      type: "footer",
      variant: "luxury",
      props: {
        title: "HTTPMAKER",
        subtitle: "Made for founders, teams, and ambitious product design.",
        buttonText: "Start now",
        secondaryButtonText: "Get the deck",
        imageUrl: "",
        alignment: "center",
        statLabel: "Launch",
        statValue: "In one evening",
      },
    },
  ],
};

export const initialWebsite = parseWebsiteData(initialWebsiteData);

export const suggestionPills = [
  "Add booking calendar",
  "Sync with Google Calendar",
  "Filter sections",
  "Make it tech-brutalist",
];
