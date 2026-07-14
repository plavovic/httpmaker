import type { ColorMode, WebsiteJSON } from "@/types/website";
export const WEBSITE_STORAGE_KEY = "httpmaker.website.v1";
export const EDITOR_THEME_STORAGE_KEY = "httpmaker.editor-theme.v1";
export function readStoredWebsite(): WebsiteJSON | null { try { const value: unknown = JSON.parse(localStorage.getItem(WEBSITE_STORAGE_KEY) ?? "null"); if (!value || typeof value !== "object" || !("theme" in value) || !("sections" in value) || !Array.isArray(value.sections)) return null; return value as WebsiteJSON; } catch { return null; } }
export function readStoredEditorTheme(): ColorMode { try { return localStorage.getItem(EDITOR_THEME_STORAGE_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } }
