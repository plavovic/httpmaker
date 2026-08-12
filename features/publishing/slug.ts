import { z } from "zod";

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 80;
export const RESERVED_SLUGS = new Set(["api", "admin", "dashboard", "editor", "login", "logout", "preview", "publish", "projects", "sites", "www", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);
export const slugSchema = z.string().trim().min(SLUG_MIN_LENGTH).max(SLUG_MAX_LENGTH).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").refine((value) => !RESERVED_SLUGS.has(value.toLowerCase()), "This slug is reserved.");

export function slugify(value: string) {
  const base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/g, "");
  const candidate = base.length >= 3 && !RESERVED_SLUGS.has(base) ? base : `site-${base || "project"}`;
  return candidate.slice(0, 80).replace(/-$/g, "");
}

export const publicationTitleSchema = z.string().trim().min(1, "Enter a website title.").max(120, "The website title must be 120 characters or fewer.");
export const publicationIconDataSchema = z.string().max(750_000).regex(/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/, "Invalid website icon.").nullable();
export const publishRequestSchema = z.object({ slug: slugSchema.optional(), expectedRevision: z.number().int().nonnegative().optional(), title: publicationTitleSchema, iconUrl: z.string().url().max(2_000).nullable(), iconData: publicationIconDataSchema }).strict();
