import type { ColorMode, WebsiteJSON } from "@/types/website";
import { normalizeWebsite } from "@/utils/normalizeWebsite";
import { parseWebsiteJSON } from "@/utils/validationSchemas";
export const WEBSITE_STORAGE_KEY = "httpmaker.website.v1";
export const EDITOR_THEME_STORAGE_KEY = "httpmaker.editor-theme.v1";
export function saveStoredWebsite(website: WebsiteJSON): boolean { try { localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(website)); return true; } catch { return false; } }
export function readStoredWebsite(): WebsiteJSON | null { try { const value: unknown = JSON.parse(localStorage.getItem(WEBSITE_STORAGE_KEY) ?? "null"); const website = parseWebsiteJSON(value); return website ? normalizeWebsite(website) : null; } catch { return null; } }
export function readStoredEditorTheme(): ColorMode { try { return localStorage.getItem(EDITOR_THEME_STORAGE_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } }
