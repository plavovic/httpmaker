import { auth } from "@/auth";
import { disconnectGitHubInstallation } from "@/features/github/server/github.repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const removed = await disconnectGitHubInstallation((await context.params).id, ownerId);
  return removed ? new Response(null, { status: 204 }) : Response.json({ error: "GitHub installation not found." }, { status: 404 });
}
