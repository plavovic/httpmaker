import { z } from "zod";
import { auth } from "@/auth";
import { findOwnedGitHubInstallation } from "@/features/github/server/github.repository";
import { findProjectByIdAndOwner, linkProjectRepository } from "@/features/projects/server/project.repository";
import { getInstallationClient } from "@/lib/github/get-installation-client";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";

const schema = z.object({ installationId: z.string().min(1).max(100), repositoryId: z.string().regex(/^\d+$/).max(30) }).strict();

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown; try { body = await readJsonBody(request, 8_000); } catch (error) { return jsonBodyError(error); }
  const input = schema.safeParse(body); if (!input.success) return Response.json({ error: "Invalid repository selection." }, { status: 400 });
  const projectId = (await context.params).projectId;
  const [project, installation] = await Promise.all([findProjectByIdAndOwner(projectId, ownerId), findOwnedGitHubInstallation(input.data.installationId, ownerId)]);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  if (!installation) return Response.json({ error: "GitHub installation not found." }, { status: 404 });
  if (installation.status !== "active") return Response.json({ error: "GitHub installation is not active." }, { status: 409 });
  try {
    const client = await getInstallationClient(installation.installationId);
    const repositories = await client.paginate("GET /installation/repositories", { per_page: 100 });
    const repository = repositories.find((item) => String(item.id) === input.data.repositoryId);
    if (!repository) return Response.json({ error: "Repository is not available to this installation." }, { status: 403 });
    await linkProjectRepository(projectId, ownerId, { installationId: installation.id, repositoryId: String(repository.id), fullName: repository.full_name, htmlUrl: repository.html_url, defaultBranch: repository.default_branch });
    return Response.json({ repository: { id: String(repository.id), fullName: repository.full_name, htmlUrl: repository.html_url, defaultBranch: repository.default_branch } });
  } catch { return Response.json({ error: "Unable to verify the selected repository." }, { status: 502 }); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const project = await findProjectByIdAndOwner((await context.params).projectId, ownerId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  const { prisma } = await import("@/lib/prisma");
  await prisma.project.update({ where: { id: project.id }, data: { githubInstallationId: null, githubRepositoryId: null, githubRepositoryFullName: null, githubDefaultBranch: null, repositoryUrl: null } });
  return new Response(null, { status: 204 });
}
