import type { ColorMode, WebsiteJSON } from "@/types/website";
import { normalizeWebsite } from "@/utils/normalizeWebsite";
import { safelyParseWebsiteData, upgradeLegacyWebsiteData } from "@/schemas/website.schema";
export const WEBSITE_STORAGE_KEY = "httpmaker.website.v1";
export const EDITOR_THEME_STORAGE_KEY = "httpmaker.editor-theme.v1";
export const STUDIO_THEMES: Array<{ value: ColorMode; label: string; appearance: "light" | "dark" }> = [
  { value: "sky", label: "Sky", appearance: "light" },
  { value: "matcha", label: "Matcha", appearance: "light" },
  { value: "iris", label: "Iris", appearance: "light" },
  { value: "midnight", label: "Midnight", appearance: "dark" },
  { value: "macao", label: "Macao", appearance: "dark" },
  { value: "vice", label: "Vice", appearance: "dark" },
];
export function isLightStudioTheme(theme: ColorMode): boolean { return theme === "sky" || theme === "matcha" || theme === "iris"; }
export function saveStoredWebsite(website: WebsiteJSON): boolean { try { localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(website)); return true; } catch { return false; } }
export function readStoredWebsite(): WebsiteJSON | null {
  try {
    const raw = localStorage.getItem(WEBSITE_STORAGE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    const result = safelyParseWebsiteData(upgradeLegacyWebsiteData(value));
    if (result.success) return normalizeWebsite(result.data);
    if (process.env.NODE_ENV !== "production") console.error("Stored website data failed validation.", result.error.issues);
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Stored website data could not be parsed.", error);
    return null;
  }
}
export function readStoredEditorTheme(): ColorMode {
  try {
    const stored = localStorage.getItem(EDITOR_THEME_STORAGE_KEY);
    if (stored === "light") return "sky";
    if (stored === "dark") return "midnight";
    return STUDIO_THEMES.some((theme) => theme.value === stored) ? stored as ColorMode : "sky";
  } catch { return "sky"; }
}
