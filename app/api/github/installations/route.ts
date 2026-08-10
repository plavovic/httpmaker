import { auth } from "@/auth";
import { listGitHubInstallations } from "@/features/github/server/github.repository";
import { isGitHubAppConfigured } from "@/lib/github/config";

export async function GET() {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  return Response.json({ configured: isGitHubAppConfigured(), installations: await listGitHubInstallations(ownerId) });
}
