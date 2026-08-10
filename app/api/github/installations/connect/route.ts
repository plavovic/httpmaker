import { auth } from "@/auth";
import { createGitHubNonce } from "@/features/github/server/github.repository";
import { githubStateSecret, isGitHubAppConfigured } from "@/lib/github/config";
import { hashGitHubNonce, signGitHubState } from "@/lib/github/state";

export async function POST() {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!isGitHubAppConfigured()) return Response.json({ error: "GitHub App connection is not configured." }, { status: 503 });
  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + 10 * 60_000;
  await createGitHubNonce(ownerId, hashGitHubNonce(nonce), new Date(expiresAt));
  const state = signGitHubState({ userId: ownerId, nonce, expiresAt }, githubStateSecret());
  const slug = process.env.GITHUB_APP_SLUG!.trim();
  return Response.json({ installationUrl: `https://github.com/apps/${encodeURIComponent(slug)}/installations/new?state=${encodeURIComponent(state)}` });
}
