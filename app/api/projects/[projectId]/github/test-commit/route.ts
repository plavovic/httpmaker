import { auth } from "@/auth";
import { projectParamsSchema } from "@/features/projects/schemas/project.schema";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { getInstallationClient } from "@/lib/github/get-installation-client";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import { buildWebsiteFiles } from "@/utils/exportWebsiteZip";

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

export async function GET(_request: Request, context: RouteContext) {
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
    const result = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      ...repository,
      per_page: 1,
    });
    const commit = result.data[0];
    return Response.json({
      commit: commit ? {
        sha: commit.sha,
        message: commit.commit.message.split("\n")[0],
        url: commit.html_url,
      } : null,
    });
  } catch (error: unknown) {
    console.error("Failed to load latest GitHub commit:", error);
    return Response.json({ error: "Unable to load the latest commit." }, { status: 502 });
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

    const repoResult = await octokit.request("GET /repos/{owner}/{repo}", repository);
    const branch = repoResult.data.default_branch;
    const reference = await octokit.request("GET /repos/{owner}/{repo}/git/ref/{ref}", {
      ...repository,
      ref: `heads/${branch}`,
    });
    const parentSha = reference.data.object.sha;
    const parentCommit = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
      ...repository,
      commit_sha: parentSha,
    });
    const currentTree = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
      ...repository,
      tree_sha: parentCommit.data.tree.sha,
      recursive: "true",
    });
    const files = buildWebsiteFiles(websiteResult.data);
    const tree: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      content?: string;
      sha?: null;
    }> = Object.entries(files).map(([path, content]) => ({
      path,
      mode: "100644" as const,
      type: "blob" as const,
      content,
    }));
    if (currentTree.data.tree.some((entry) => entry.path === "httpmaker-website.zip")) {
      tree.push({ path: "httpmaker-website.zip", mode: "100644", type: "blob", sha: null });
    }

    const newTree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
      ...repository,
      base_tree: parentCommit.data.tree.sha,
      tree,
    });
    const timestamp = new Date().toISOString();
    const message = `Export ${project.name} from HTTPMAKER at ${timestamp}`;
    const result = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
      ...repository,
      message,
      tree: newTree.data.sha,
      parents: [parentSha],
    });
    await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
      ...repository,
      ref: `heads/${branch}`,
      sha: result.data.sha,
    });

    return Response.json({
      commit: {
        sha: result.data.sha,
        message,
        url: result.data.html_url,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to create GitHub test commit:", error);
    return Response.json(
      { error: "Unable to create the test commit. Check the GitHub App Contents permission." },
      { status: 502 },
    );
  }
}
