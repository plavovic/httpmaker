import { auth } from "@/auth";
import { getInstallationClient } from "@/lib/github/get-installation-client";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const octokit = await getInstallationClient();
    const repositories = await octokit.paginate(
      "GET /installation/repositories",
      { per_page: 100 },
    );

    return Response.json({
      totalCount: repositories.length,
      repositories,
    });
  } catch (error: unknown) {
    console.error("Failed to list GitHub installation repositories:", error);

    return Response.json(
      { error: "Unable to load GitHub repositories." },
      { status: 502 },
    );
  }
}
