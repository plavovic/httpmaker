import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { App } from "octokit";

let app: App | undefined;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPrivateKey(): string {
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (privateKey) {
    // Environment providers commonly store multiline secrets with escaped newlines.
    return privateKey.replace(/\\n/g, "\n");
  }

  const privateKeyPath = requiredEnvironmentVariable(
    "GITHUB_APP_PRIVATE_KEY_PATH",
  );

  return readFileSync(resolve(process.cwd(), privateKeyPath), "utf8");
}

export function getGitHubApp(): App {
  if (!app) {
    app = new App({
      appId: requiredEnvironmentVariable("GITHUB_APP_ID"),
      privateKey: getPrivateKey(),
    });
  }

  return app;
}
