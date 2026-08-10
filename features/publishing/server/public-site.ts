import "server-only";
import { findPublishedProjectBySlug } from "@/features/projects/server/project.repository";
import { slugSchema } from "@/features/publishing/slug";
import { safelyParseWebsiteData } from "@/schemas/website.schema";

export async function loadPublishedSite(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  const project = await findPublishedProjectBySlug(slug);
  if (!project) return null;
  const website = safelyParseWebsiteData(project.publishedWebsite);
  return website.success ? { project, website: website.data } : null;
}
