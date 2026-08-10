import "server-only";

export const isGlobalGitHubAppEnabled = () => process.env.HTTPMAKER_ENABLE_GLOBAL_GITHUB_APP === "true";

export function githubFeatureDisabledResponse() {
  return Response.json({ error: "GitHub integration is disabled." }, { status: 404 });
}
