import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { findOtherPublishedProject, findProjectByIdAndOwner, LivePublicationLimitError, publishProject, SlugConflictError, unpublishProject } from "@/features/projects/server/project.repository";
import { publishRequestSchema } from "@/features/publishing/slug";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { prepareProjectPublication } from "@/features/publishing/server/preflight";
import { apiError } from "@/lib/server/api-error";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/server/request";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import { findProjectAssetByPublicUrl } from "@/features/assets/server/asset.repository";
import { publishRateLimiter, rateLimitResponse } from "@/lib/server/rate-limit";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return apiError("UNAUTHENTICATED", "Sign in to manage publishing.", 401);
  const project = await findProjectByIdAndOwner((await context.params).projectId, ownerId);
  if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);
  const parsed = safelyParseWebsiteData(project.website);
  const unresolvedAssetCount = parsed.success ? findLegacyAssetReferences(parsed.data).length : 0;
  const otherLiveProject = await findOtherPublishedProject(ownerId, project.id);
  return Response.json({ project: { id: project.id, name: project.name, slug: project.slug, isPublished: project.isPublished, updatedAt: project.updatedAt, publishedAt: project.publishedAt, draftRevision: project.draftRevision, publishedRevision: project.publishedRevision, publicationTitle: project.publicationTitle, publicationIconUrl: project.publicationIconUrl, publicationIconData: project.publicationIconData }, preflight: { draftValid: parsed.success, unresolvedAssetCount }, publicationLimit: { otherLiveProject } });
}

export async function POST(request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return apiError("UNAUTHENTICATED", "Sign in to publish.", 401);
  const rate=await publishRateLimiter.consume(ownerId);if(!rate.allowed)return rateLimitResponse(rate.retryAfterSeconds);
  const { projectId } = await context.params;
  let body: unknown = {};
  if (request.headers.get("content-length") !== "0") try { body = await readJsonBody(request, 800_000); } catch (error) { return error instanceof RequestBodyTooLargeError ? apiError("BODY_TOO_LARGE", "The request body is too large.", 413) : apiError("INVALID_JSON", "The request body must be valid JSON.", 400); }
  const input = publishRequestSchema.safeParse(body);
  if (!input.success) return apiError("INVALID_PUBLICATION", "Invalid publication settings.", 400, input.error.flatten());
  const preflight = await prepareProjectPublication(projectId, ownerId, input.data.slug);
  if (!preflight.success) {
    const message = typeof preflight.body.error === "string" ? preflight.body.error : "The draft cannot be published.";
    return apiError(preflight.status === 404 ? "PROJECT_NOT_FOUND" : preflight.status === 422 ? "DRAFT_UNPUBLISHABLE" : "INVALID_SLUG", message, preflight.status, preflight.body);
  }
  if (input.data.expectedRevision !== undefined && input.data.expectedRevision !== preflight.project.draftRevision) return apiError("DRAFT_CONFLICT", "The draft changed. Reload publishing details and try again.", 409, { currentRevision: preflight.project.draftRevision });
  if (input.data.iconUrl) {
    const icon = await findProjectAssetByPublicUrl(input.data.iconUrl, projectId, ownerId);
    if (!icon || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(icon.mimeType)) return apiError("INVALID_PUBLICATION_ICON", "Choose an icon uploaded to this project.", 400);
  }
  try {
    const publication = await publishProject(projectId, ownerId, preflight.slug, preflight.website, preflight.project.draftRevision, { title: input.data.title, iconUrl: input.data.iconUrl, iconData: input.data.iconData });
    if (!publication) return apiError("DRAFT_CONFLICT", "The draft changed while publishing. Reload and try again.", 409);
    return Response.json({ publication: { ...publication, path: `/${publication.slug}` } });
  } catch (error) {
    if (error instanceof LivePublicationLimitError) return apiError("LIVE_PUBLICATION_LIMIT", `“${error.liveProject.name}” is already live. Unpublish it before publishing another website.`, 409, { liveProject: error.liveProject });
    if (error instanceof SlugConflictError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) return apiError("SLUG_TAKEN", "That public URL is already in use.", 409);
    console.error("Publish failed", { projectId, ownerId, errorName: error instanceof Error ? error.name : "unknown" });
    return apiError("PUBLISH_FAILED", "Unable to publish the project.", 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return apiError("UNAUTHENTICATED", "Sign in to unpublish.", 401);
  const rate=await publishRateLimiter.consume(ownerId);if(!rate.allowed)return rateLimitResponse(rate.retryAfterSeconds);
  const { projectId } = await context.params;
  const result = await unpublishProject(projectId, ownerId);
  if (!result.count) return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);
  return new Response(null, { status: 204 });
}
