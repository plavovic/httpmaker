import "server-only";

export type GoogleOAuthConfig = { enabled: false } | { enabled: true; clientId: string; clientSecret: string };

export function googleOAuthConfig(environment: Record<string,string|undefined> = process.env): GoogleOAuthConfig {
  const clientId = environment.AUTH_GOOGLE_ID?.trim() ?? "";
  const clientSecret = environment.AUTH_GOOGLE_SECRET?.trim() ?? "";
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be configured together.");
  }
  return clientId && clientSecret ? { enabled: true, clientId, clientSecret } : { enabled: false };
}

export function isVerifiedGoogleProfile(account: { provider?: string } | null | undefined, profile?: Record<string, unknown>) {
  return account?.provider !== "google" || profile?.email_verified === true;
}
