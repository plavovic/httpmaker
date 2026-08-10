import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { findProjectByIdAndOwner, publishProject, unpublishProject } from "@/features/projects/server/project.repository";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { publishRequestSchema, slugify, slugSchema } from "@/features/publishing/slug";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";
import { safelyParseWebsiteData } from "@/schemas/website.schema";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { projectId } = await context.params;
  let body: unknown = {};
  if (request.headers.get("content-length") !== "0") try { body = await readJsonBody(request, 8_000); } catch (error) { return jsonBodyError(error); }
  const input = publishRequestSchema.safeParse(body);
  if (!input.success) return Response.json({ error: "Invalid publication settings.", details: input.error.flatten() }, { status: 400 });
  const project = await findProjectByIdAndOwner(projectId, ownerId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  const website = safelyParseWebsiteData(project.website);
  if (!website.success) return Response.json({ error: "The draft contains invalid website data.", details: website.error.flatten() }, { status: 422 });
  const localAssets = findLegacyAssetReferences(website.data);
  if (localAssets.length) return Response.json({ error: "Upload local legacy assets before publishing.", unresolvedAssetCount: localAssets.length, unresolvedAssets: localAssets }, { status: 422 });
  const slug = input.data.slug ?? project.slug ?? slugify(project.name);
  const slugResult = slugSchema.safeParse(slug);
  if (!slugResult.success) return Response.json({ error: "Invalid publication slug.", details: slugResult.error.flatten() }, { status: 400 });
  try {
    const publication = await publishProject(projectId, ownerId, slugResult.data, website.data);
    return Response.json({ publication: { ...publication, path: `/sites/${publication.slug}` } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "That public slug is already in use." }, { status: 409 });
    console.error("Publish failed:", error);
    return Response.json({ error: "Unable to publish the project." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { projectId } = await context.params;
  const result = await unpublishProject(projectId, ownerId);
  if (!result.count) return Response.json({ error: "Project not found." }, { status: 404 });
  return new Response(null, { status: 204 });
}
