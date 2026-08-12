import "server-only";

type AccessibleInstallation = { id: number; account: { id: number; login?: string; slug?: string; type?: string } | string | null };

export async function listInstallationsAuthorizedForCode(code: string, signal?: AbortSignal): Promise<AccessibleInstallation[]> {
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("GitHub user authorization is not configured.");
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    cache: "no-store",
    signal,
  });
  if (!tokenResponse.ok) throw new Error("GitHub user authorization failed.");
  const tokenBody = await tokenResponse.json() as { access_token?: unknown };
  if (typeof tokenBody.access_token !== "string" || !tokenBody.access_token) throw new Error("GitHub user authorization failed.");
  const response = await fetch("https://api.github.com/user/installations?per_page=100", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${tokenBody.access_token}`, "X-GitHub-Api-Version": "2022-11-28" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("GitHub installation verification failed.");
  const body = await response.json() as { installations?: unknown };
  if (!Array.isArray(body.installations)) throw new Error("GitHub installation verification failed.");
  return body.installations.slice(0, 100) as AccessibleInstallation[];
}
