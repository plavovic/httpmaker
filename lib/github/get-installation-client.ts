import "server-only";

import { getGitHubApp } from "@/lib/github/app";

function getInstallationId(value: string): number {
  const installationId = Number(value);

  if (!/^\d+$/.test(value) || !Number.isSafeInteger(installationId) || installationId <= 0) {
    throw new Error(
      "GitHub installation ID is invalid or outside the supported API range.",
    );
  }

  return installationId;
}

export async function getInstallationClient(installationId: string) {
  return getGitHubApp().getInstallationOctokit(getInstallationId(installationId));
}
