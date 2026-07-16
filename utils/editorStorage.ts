import type { ColorMode, WebsiteJSON } from "@/types/website";
import { normalizeWebsite } from "@/utils/normalizeWebsite";
import { safelyParseWebsiteData, upgradeLegacyWebsiteData } from "@/schemas/website.schema";
export const WEBSITE_STORAGE_KEY = "httpmaker.website.v1";
export const EDITOR_THEME_STORAGE_KEY = "httpmaker.editor-theme.v1";
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
export function readStoredEditorTheme(): ColorMode { try { return localStorage.getItem(EDITOR_THEME_STORAGE_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } }
