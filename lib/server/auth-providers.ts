import "server-only";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { googleOAuthConfig } from "@/lib/server/oauth-config";

export function authProviders(environment: Record<string,string|undefined> = process.env) {
  const google=googleOAuthConfig(environment);
  return [GitHub, ...(google.enabled ? [Google({clientId:google.clientId,clientSecret:google.clientSecret})] : [])];
}
