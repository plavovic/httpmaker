import "server-only";

import { getGitHubApp } from "@/lib/github/app";

function getInstallationId(): number {
  const value = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const installationId = Number(value);

  if (!value || !Number.isSafeInteger(installationId) || installationId <= 0) {
    throw new Error(
      "GITHUB_APP_INSTALLATION_ID must be a positive integer.",
    );
  }

  return installationId;
}

export async function getInstallationClient() {
  return getGitHubApp().getInstallationOctokit(getInstallationId());
}
