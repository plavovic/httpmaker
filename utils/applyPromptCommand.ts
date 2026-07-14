import type { WebsiteJSON } from "@/types/website";

export function applyPromptCommand(website: WebsiteJSON, message: string, selectedSectionId: string): WebsiteJSON {
  const lower = message.toLowerCase();
  let nextWebsite: WebsiteJSON = {
    ...website,
    theme: { ...website.theme },
    sections: website.sections.map((section) => ({ ...section, props: { ...section.props } })),
  };

  if (lower.includes("background") || lower.includes("bg")) {
    const colorMap: Record<string, string> = {
      blue: "#dbeafe",
      emerald: "#d1fae5",
      coral: "#ffe4e6",
      midnight: "#0b1020",
      black: "#050505",
    };
    const matched = Object.keys(colorMap).find((color) => lower.includes(color));
    if (matched) {
      const isDark = matched === "black" || matched === "midnight";
      nextWebsite = {
        ...nextWebsite,
        theme: {
          ...nextWebsite.theme,
          backgroundColor: colorMap[matched],
          textColor: isDark ? "#f8fafc" : "#111111",
          primaryColor: isDark ? "#f2b807" : "#111111",
        },
      };
    }
  }

  if (lower.includes("tech-brutalist") || lower.includes("brutalist")) {
    nextWebsite = {
      ...nextWebsite,
      theme: { ...nextWebsite.theme, backgroundColor: "#050505", surfaceColor: "#111111", primaryColor: "#f2b807", textColor: "#f8fafc", mutedTextColor: "#a1a1aa", headingFont: "Inter", bodyFont: "Inter", imageTreatment: "high-contrast" },
      sections: nextWebsite.sections.map((section) => ({ ...section, variant: "brutalist" })),
    };
  }

  if (lower.includes("luxury") || lower.includes("pastel") || lower.includes("elegant")) {
    nextWebsite = {
      ...nextWebsite,
      theme: { ...nextWebsite.theme, backgroundColor: "#f7f0e7", surfaceColor: "#fffaf3", primaryColor: "#111111", textColor: "#111111", mutedTextColor: "#6f665d", headingFont: "Georgia", bodyFont: "Inter", imageTreatment: "soft" },
      sections: nextWebsite.sections.map((section) => ({ ...section, variant: "luxury" })),
    };
  }

  const titleMatch = message.match(/title to\s+(.+)/i);
  const subtitleMatch = message.match(/subtitle to\s+(.+)/i);
  if (titleMatch || subtitleMatch) {
    nextWebsite = {
      ...nextWebsite,
      sections: nextWebsite.sections.map((section) =>
        section.id === selectedSectionId
          ? {
              ...section,
              props: {
                ...section.props,
                ...(titleMatch ? { title: titleMatch[1].trim() } : {}),
                ...(subtitleMatch ? { subtitle: subtitleMatch[1].trim() } : {}),
              },
            }
          : section,
      ),
    };
  }

  return nextWebsite;
}
