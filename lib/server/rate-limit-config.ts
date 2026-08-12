import "server-only";

export type RateLimitRestConfig = { url: string; token: string; source: "explicit" | "vercel-kv" };

const obviousPlaceholders = new Set([
  "change-me", "changeme", "example", "placeholder", "secret", "test",
  "your-token", "your_token", "your-url", "your_url",
]);

const value = (environment: Record<string, string | undefined>, name: string) => environment[name]?.trim() || "";

function validatePair(environment: Record<string, string | undefined>, urlName: string, tokenName: string) {
  const url = value(environment, urlName);
  const token = value(environment, tokenName);
  if (Boolean(url) !== Boolean(token)) throw new Error(`${urlName} and ${tokenName} must be configured together.`);
  return url && token ? { url, token } : null;
}

function normalizedUrl(name: string, raw: string, production: boolean) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error(`${name} must be a valid URL.`); }
  if (production && url.protocol !== "https:") throw new Error(`${name} must use HTTPS in production.`);
  if (url.username || url.password) throw new Error(`${name} must not contain credentials.`);
  if (url.hash) throw new Error(`${name} must not contain a fragment.`);
  if (obviousPlaceholders.has(raw.toLowerCase()) || ["example.com", "example.invalid", "localhost"].includes(url.hostname.toLowerCase())) {
    throw new Error(`${name} must not use a placeholder endpoint.`);
  }
  return url.toString().replace(/\/$/, "");
}

export function resolveRateLimitConfig(
  environment: Record<string, string | undefined> = process.env,
  options: { require?: boolean; production?: boolean } = {},
): RateLimitRestConfig | null {
  const production = options.production ?? environment.NODE_ENV === "production";
  const explicit = validatePair(environment, "RATE_LIMIT_REST_URL", "RATE_LIMIT_REST_TOKEN");
  const pair = explicit ?? validatePair(environment, "KV_REST_API_URL", "KV_REST_API_TOKEN");
  if (!pair) {
    if (options.require ?? production) throw new Error("A complete RATE_LIMIT_REST_URL/RATE_LIMIT_REST_TOKEN or KV_REST_API_URL/KV_REST_API_TOKEN pair is required in production.");
    return null;
  }
  const source = explicit ? "explicit" : "vercel-kv";
  const urlName = explicit ? "RATE_LIMIT_REST_URL" : "KV_REST_API_URL";
  const tokenName = explicit ? "RATE_LIMIT_REST_TOKEN" : "KV_REST_API_TOKEN";
  if (obviousPlaceholders.has(pair.token.toLowerCase())) throw new Error(`${tokenName} must not be an obvious placeholder.`);
  return { url: normalizedUrl(urlName, pair.url, production), token: pair.token, source };
}
