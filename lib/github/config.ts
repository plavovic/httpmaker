import "server-only";

export function isGitHubAppConfigured() {
  return Boolean(process.env.GITHUB_APP_ID?.trim() && process.env.GITHUB_APP_SLUG?.trim() && (process.env.GITHUB_APP_PRIVATE_KEY?.trim() || process.env.GITHUB_APP_PRIVATE_KEY_PATH?.trim()) && (process.env.GITHUB_APP_STATE_SECRET?.trim() || process.env.AUTH_SECRET?.trim()) && process.env.GITHUB_APP_WEBHOOK_SECRET?.trim() && process.env.GITHUB_APP_CLIENT_ID?.trim() && process.env.GITHUB_APP_CLIENT_SECRET?.trim());
}

export function githubStateSecret() {
  const value = process.env.GITHUB_APP_STATE_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("GitHub App state signing is not configured.");
  return value;
}
