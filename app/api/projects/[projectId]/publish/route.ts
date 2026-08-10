import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { publishProject, unpublishProject } from "@/features/projects/server/project.repository";
import { publishRequestSchema } from "@/features/publishing/slug";
import { prepareProjectPublication } from "@/features/publishing/server/preflight";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { projectId } = await context.params;
  let body: unknown = {};
  if (request.headers.get("content-length") !== "0") try { body = await readJsonBody(request, 8_000); } catch (error) { return jsonBodyError(error); }
  const input = publishRequestSchema.safeParse(body);
  if (!input.success) return Response.json({ error: "Invalid publication settings.", details: input.error.flatten() }, { status: 400 });
  const preflight = await prepareProjectPublication(projectId, ownerId, input.data.slug);
  if (!preflight.success) return Response.json(preflight.body, { status: preflight.status });
  try {
    const publication = await publishProject(projectId, ownerId, preflight.slug, preflight.website);
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
