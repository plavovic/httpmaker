import { describe, expect, it, vi } from "vitest";
import { resolveRateLimitConfig } from "@/lib/server/rate-limit-config";
import { createDistributedRateLimiter } from "@/lib/server/rate-limit";
import { assertProductionAuthEnvironment } from "@/lib/server/env";

const explicit = { RATE_LIMIT_REST_URL: "https://rate.internal.test/path/", RATE_LIMIT_REST_TOKEN: "generated-test-token-123" };
const kv = { KV_REST_API_URL: "https://kv.internal.test/", KV_REST_API_TOKEN: "kv-generated-test-token" };
const production = {
  NODE_ENV: "production", DATABASE_URL: "postgresql://user:test-fragment@db.internal/app",
  HTTPMAKER_AI_PROVIDER: "mock", NEXT_PUBLIC_APP_URL: "https://app.internal.test", AUTH_URL: "https://app.internal.test",
  AUTH_SECRET: "random-test-material-that-is-at-least-32-bytes", AUTH_GITHUB_ID: "generated-test-github-id",
  AUTH_GITHUB_SECRET: "generated-test-github-secret", AUTH_GOOGLE_ID: "generated-test-google-id",
  AUTH_GOOGLE_SECRET: "generated-test-google-secret", BLOB_READ_WRITE_TOKEN: "generated-test-blob-token",
};

describe("rate-limit environment resolution", () => {
  it("resolves the explicit pair and normalizes its trailing slash", () => expect(resolveRateLimitConfig(explicit)).toEqual({ url: "https://rate.internal.test/path", token: explicit.RATE_LIMIT_REST_TOKEN, source: "explicit" }));
  it("resolves the Vercel KV pair", () => expect(resolveRateLimitConfig(kv)).toEqual({ url: "https://kv.internal.test", token: kv.KV_REST_API_TOKEN, source: "vercel-kv" }));
  it("gives a complete explicit pair precedence", () => expect(resolveRateLimitConfig({ ...kv, ...explicit })?.source).toBe("explicit"));
  it("returns null when optional and missing", () => expect(resolveRateLimitConfig({})).toBeNull());
  it("requires a complete pair in production", () => expect(() => resolveRateLimitConfig({ NODE_ENV: "production" })).toThrow(/complete RATE_LIMIT_REST_URL/));
  it("rejects a partial explicit pair even with a KV fallback", () => expect(() => resolveRateLimitConfig({ ...kv, RATE_LIMIT_REST_URL: explicit.RATE_LIMIT_REST_URL })).toThrow(/RATE_LIMIT_REST_URL and RATE_LIMIT_REST_TOKEN/));
  it("rejects a partial KV pair without an explicit pair", () => expect(() => resolveRateLimitConfig({ KV_REST_API_URL: kv.KV_REST_API_URL })).toThrow(/KV_REST_API_URL and KV_REST_API_TOKEN/));
  it("rejects HTTP in production", () => expect(() => resolveRateLimitConfig({ NODE_ENV: "production", RATE_LIMIT_REST_URL: "http://redis.internal", RATE_LIMIT_REST_TOKEN: "generated-token" })).toThrow(/HTTPS/));
  it("rejects malformed URLs", () => expect(() => resolveRateLimitConfig({ RATE_LIMIT_REST_URL: "not a url", RATE_LIMIT_REST_TOKEN: "generated-token" })).toThrow(/valid URL/));
  it("rejects URL credentials", () => expect(() => resolveRateLimitConfig({ RATE_LIMIT_REST_URL: "https://user:pass@redis.internal", RATE_LIMIT_REST_TOKEN: "generated-token" })).toThrow(/credentials/));
  it("accepts legitimate generated values containing test", () => expect(() => assertProductionAuthEnvironment({ ...production, ...kv })).not.toThrow());
  it("rejects exact placeholder tokens", () => expect(() => resolveRateLimitConfig({ RATE_LIMIT_REST_URL: "https://redis.internal", RATE_LIMIT_REST_TOKEN: "placeholder" })).toThrow(/placeholder/));
  it("never uses the read-only token", () => expect(() => resolveRateLimitConfig({ NODE_ENV: "production", KV_REST_API_URL: kv.KV_REST_API_URL, KV_REST_API_READ_ONLY_TOKEN: "read-only" })).toThrow(/KV_REST_API_URL and KV_REST_API_TOKEN/));
});

describe("distributed limiter Vercel KV fallback", () => {
  it("uses the resolved KV endpoint and write token", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 }));
    const limiter = createDistributedRateLimiter(2, 60_000, { environment: { ...kv, VERCEL_ENV: "production" }, fetch: request, now: () => 120_000 });
    await expect(limiter.consume("sensitive-user-id")).resolves.toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0];
    expect(url).toBe("https://kv.internal.test/pipeline");
    expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${kv.KV_REST_API_TOKEN}`);
    expect(String(init?.body)).not.toContain("sensitive-user-id");
  });
});
