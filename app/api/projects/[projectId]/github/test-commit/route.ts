import { auth } from "@/auth";
import { projectParamsSchema } from "@/features/projects/schemas/project.schema";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { getInstallationClient } from "@/lib/github/get-installation-client";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import { buildWebsiteZip } from "@/utils/exportWebsiteZip";

type RouteContext = { params: Promise<{ projectId: string }> };

function parseGitHubRepository(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parts.length !== 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const paramsResult = projectParamsSchema.safeParse(await context.params);
  if (!paramsResult.success) return Response.json({ error: "Invalid project ID." }, { status: 400 });

  const project = await findProjectByIdAndOwner(paramsResult.data.projectId, ownerId);
  if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
  if (!project.repositoryUrl) return Response.json({ error: "Link a GitHub repository first." }, { status: 400 });

  const repository = parseGitHubRepository(project.repositoryUrl);
  if (!repository) return Response.json({ error: "The linked GitHub repository URL is invalid." }, { status: 400 });

  try {
    const octokit = await getInstallationClient();
    const websiteResult = safelyParseWebsiteData(project.website);
    if (!websiteResult.success) {
      return Response.json({ error: "The project contains invalid website data." }, { status: 422 });
    }

    const path = "httpmaker-website.zip";
    let sha: string | undefined;

    try {
      const existing = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { ...repository, path });
      if (!Array.isArray(existing.data)) sha = existing.data.sha;
    } catch (error: unknown) {
      if (!(error && typeof error === "object" && "status" in error && error.status === 404)) throw error;
    }

    const archive = await buildWebsiteZip(websiteResult.data);

    const result = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      ...repository,
      path,
      message: `Export ${project.name} from HTTPMAKER`,
      content: Buffer.from(archive).toString("base64"),
      ...(sha ? { sha } : {}),
    });

    return Response.json({ commitUrl: result.data.commit.html_url });
  } catch (error: unknown) {
    console.error("Failed to create GitHub test commit:", error);
    return Response.json(
      { error: "Unable to create the test commit. Check the GitHub App Contents permission." },
      { status: 502 },
    );
  }
}
