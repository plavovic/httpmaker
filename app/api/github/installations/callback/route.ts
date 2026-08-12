import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { consumeGitHubNonce, findGitHubInstallationByExternalId, upsertGitHubInstallation } from "@/features/github/server/github.repository";
import { listInstallationsAuthorizedForCode } from "@/lib/github/user-authorization";
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
  const code = query.get("code") ?? "";
  if (!code) redirect(dashboard(query.get("error") ? "cancelled" : "authorization-missing"));
  if (installationId && !/^\d+$/.test(installationId)) redirect(dashboard("invalid-installation"));
  const payload = verifyGitHubState(state, githubStateSecret());
  if (!payload || payload.userId !== ownerId) redirect(dashboard("invalid-state"));
  const consumed = await consumeGitHubNonce(ownerId, hashGitHubNonce(payload.nonce));
  if (consumed.count !== 1) redirect(dashboard("expired-or-replayed"));
  let authorized: Awaited<ReturnType<typeof listInstallationsAuthorizedForCode>> = [];
  try {
    authorized = await listInstallationsAuthorizedForCode(code);
  } catch {
    console.error("GitHub installation verification failed.");
    redirect(dashboard("verification-temporary-failure"));
  }
  const candidates = installationId ? authorized.filter(item => String(item.id) === installationId) : authorized;
  if (!candidates.length) redirect(dashboard("installation-not-authorized"));
  for (const item of candidates) {
    const existing = await findGitHubInstallationByExternalId(String(item.id));
    if (existing && existing.ownerId !== ownerId) redirect(dashboard("already-owned"));
  }
  try {
    for (const item of candidates) {
      const account = item.account;
      if (!account || typeof account === "string") continue;
      const login = "login" in account && account.login ? account.login : "slug" in account && account.slug ? account.slug : `account-${account.id}`;
      await upsertGitHubInstallation({ ownerId, installationId: String(item.id), accountId: String(account.id), accountLogin: login, accountType: account.type ?? ("slug" in account ? "Enterprise" : "User") });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") redirect(dashboard("already-owned"));
    console.error("GitHub installation persistence failed.");
    redirect(dashboard("verification-failed"));
  }
  redirect(dashboard("connected"));
}
