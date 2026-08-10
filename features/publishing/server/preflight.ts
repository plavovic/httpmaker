import "server-only";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { slugify, slugSchema } from "@/features/publishing/slug";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import type { WebsiteJSON } from "@/types/website";

export type PublicationPreflight =
  | { success: true; project: NonNullable<Awaited<ReturnType<typeof findProjectByIdAndOwner>>>; website: WebsiteJSON; slug: string }
  | { success: false; status: 400 | 404 | 422; body: Record<string, unknown> };

export async function prepareProjectPublication(projectId: string, ownerId: string, requestedSlug?: string): Promise<PublicationPreflight> {
  const project = await findProjectByIdAndOwner(projectId, ownerId);
  if (!project) return { success: false, status: 404, body: { error: "Project not found." } };
  const website = safelyParseWebsiteData(project.website);
  if (!website.success) return { success: false, status: 422, body: { error: "The draft contains invalid website data.", issueCount: Math.min(website.error.issues.length, 100), issues: website.error.issues.slice(0, 20).map((issue) => ({ path: issue.path.slice(0, 10), message: issue.message.slice(0, 300) })) } };
  const unresolvedAssets = findLegacyAssetReferences(website.data);
  if (unresolvedAssets.length) return { success: false, status: 422, body: { error: "Upload local legacy assets before publishing.", unresolvedAssetCount: unresolvedAssets.length, unresolvedAssets: unresolvedAssets.slice(0, 50) } };
  const slug = requestedSlug ?? project.slug ?? slugify(project.name);
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) return { success: false, status: 400, body: { error: "Invalid publication slug.", issues: parsedSlug.error.issues.slice(0, 10).map((issue) => issue.message) } };
  return { success: true, project, website: website.data, slug: parsedSlug.data };
}
