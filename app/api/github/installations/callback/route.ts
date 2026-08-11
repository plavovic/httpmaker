import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { consumeGitHubNonce, findGitHubInstallationByExternalId, upsertGitHubInstallation } from "@/features/github/server/github.repository";
import { getGitHubApp } from "@/lib/github/app";
import { githubStateSecret, isGitHubAppConfigured } from "@/lib/github/config";
import { hashGitHubNonce, verifyGitHubState } from "@/lib/github/state";

const dashboard = (status: string) => `/dashboard?github=${encodeURIComponent(status)}`;

export async function GET(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) redirect("/login");
  if (!isGitHubAppConfigured()) redirect(dashboard("not-configured"));
  const query = new URL(request.url).searchParams;
  const state = query.get("state") ?? "";
  const installationId = query.get("installation_id") ?? "";
  if (!/^\d+$/.test(installationId)) redirect(dashboard("invalid-installation"));
  const payload = verifyGitHubState(state, githubStateSecret());
  if (!payload || payload.userId !== ownerId) redirect(dashboard("invalid-state"));
  const consumed = await consumeGitHubNonce(ownerId, hashGitHubNonce(payload.nonce));
  if (consumed.count !== 1) redirect(dashboard("expired-or-replayed"));
  const existing = await findGitHubInstallationByExternalId(installationId);
  if (existing && existing.ownerId !== ownerId) redirect(dashboard("already-owned"));
  let account: { id: number; login: string; type?: string } | null = null;
  try {
    const response = await getGitHubApp().octokit.request("GET /app/installations/{installation_id}", {
      installation_id: Number(installationId),
    });
    const verified = response.data.account;
    if (verified && typeof verified !== "string") {
      account = "login" in verified
        ? { id: verified.id, login: verified.login, type: verified.type }
        : { id: verified.id, login: verified.slug, type: "Enterprise" };
    }
  } catch {
    console.error("GitHub installation verification failed.");
  }
  if (!account) redirect(dashboard("verification-failed"));
  try {
    await upsertGitHubInstallation({ ownerId, installationId, accountId: String(account.id), accountLogin: account.login, accountType: account.type ?? "User" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") redirect(dashboard("already-owned"));
    console.error("GitHub installation persistence failed.");
    redirect(dashboard("verification-failed"));
  }
  redirect(dashboard("connected"));
}
