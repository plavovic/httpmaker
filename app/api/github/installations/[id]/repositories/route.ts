import { auth } from "@/auth";
import { findOwnedGitHubInstallation } from "@/features/github/server/github.repository";
import { getInstallationClient } from "@/lib/github/get-installation-client";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const installation = await findOwnedGitHubInstallation((await context.params).id, ownerId);
  if (!installation) return Response.json({ error: "GitHub installation not found." }, { status: 404 });
  if (installation.status !== "active") return Response.json({ error: "GitHub installation is not active." }, { status: 409 });
  try {
    const client = await getInstallationClient(installation.installationId);
    const repositories = await client.paginate("GET /installation/repositories", { per_page: 100 });
    return Response.json({ repositories: repositories.map((repo) => ({ id: String(repo.id), fullName: repo.full_name, htmlUrl: repo.html_url, private: repo.private, defaultBranch: repo.default_branch })) });
  } catch { return Response.json({ error: "Unable to load repositories for this installation." }, { status: 502 }); }
}
