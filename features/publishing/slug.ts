import { z } from "zod";

export const RESERVED_SLUGS = new Set(["api", "admin", "dashboard", "editor", "login", "preview", "sites", "www"]);
export const slugSchema = z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").refine((value) => !RESERVED_SLUGS.has(value), "This slug is reserved.");

export function slugify(value: string) {
  const base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/g, "");
  const candidate = base.length >= 3 && !RESERVED_SLUGS.has(base) ? base : `site-${base || "project"}`;
  return candidate.slice(0, 80).replace(/-$/g, "");
}

export const publishRequestSchema = z.object({ slug: slugSchema.optional() }).strict();
