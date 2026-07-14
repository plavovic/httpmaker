import { initialWebsite } from "@/data/initialWebsite";
import type { WebsiteJSON, WebsiteTheme } from "@/types/website";
export function normalizeTheme(theme:Partial<WebsiteTheme> & {fontFamily?:string}):WebsiteTheme { const base=initialWebsite.theme; return {...base,...theme,headingFont:theme.headingFont??theme.fontFamily??base.headingFont,bodyFont:theme.bodyFont??theme.fontFamily??base.bodyFont}; }
export function normalizeWebsite(website:WebsiteJSON):WebsiteJSON { return {...website,theme:normalizeTheme(website.theme)}; }
