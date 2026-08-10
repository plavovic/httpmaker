import { describe, expect, it } from "vitest";
import { initialWebsite } from "@/data/initialWebsite";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { RESERVED_SLUGS, slugify, slugSchema } from "@/features/publishing/slug";
import { isSupportedImageBytes, MAX_ASSET_BYTES } from "@/lib/assets/validation";
import { websiteSchema } from "@/schemas/website.schema";

describe("publication slugs", () => {
  it.each(["my-site", "abc", "site-42"])("accepts %s", (slug) => expect(slugSchema.safeParse(slug).success).toBe(true));
  it.each(["ab", "UPPER", "two--hyphens", "-leading", "trailing-"])("rejects %s", (slug) => expect(slugSchema.safeParse(slug).success).toBe(false));
  it("rejects every reserved slug", () => { for (const slug of RESERVED_SLUGS) expect(slugSchema.safeParse(slug).success).toBe(false); });
  it("creates a safe initial slug", () => expect(slugify("  Café & Studio  ")).toBe("cafe-studio"));
});

describe("bounded WebsiteJSON", () => {
  it("accepts the canonical initial website", () => expect(websiteSchema.safeParse(initialWebsite).success).toBe(true));
  it("rejects unsafe image schemes", () => expect(websiteSchema.safeParse({ ...initialWebsite, theme: { ...initialWebsite.theme, backgroundImageUrl: "javascript:alert(1)" } }).success).toBe(false));
  it("rejects arbitrary color strings", () => expect(websiteSchema.safeParse({ ...initialWebsite, theme: { ...initialWebsite.theme, textColor: "url(https://attacker.invalid)" } }).success).toBe(false));
  it("rejects too many sections", () => expect(websiteSchema.safeParse({ ...initialWebsite, sections: Array.from({ length: 51 }, (_, index) => ({ ...initialWebsite.sections[0], id: `section-${index}` })) }).success).toBe(false));
  it("rejects oversized content", () => expect(websiteSchema.safeParse({ ...initialWebsite, sections: [{ ...initialWebsite.sections[0], props: { ...initialWebsite.sections[0].props, title: "x".repeat(5001) } }] }).success).toBe(false));
});

describe("legacy assets and upload signatures", () => {
  it("finds unique unresolved local references", () => expect(findLegacyAssetReferences({ a: "asset://one", nested: ["asset://one", "asset://two", "https://example.com/x.png"] })).toEqual(["asset://one", "asset://two"]));
  it("does not flag synchronized URLs", () => expect(findLegacyAssetReferences(initialWebsite)).toEqual([]));
  it("recognizes supported image signatures", () => {
    expect(isSupportedImageBytes(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(true);
    expect(isSupportedImageBytes(Uint8Array.from([137,80,78,71,13,10,26,10]), "image/png")).toBe(true);
    expect(isSupportedImageBytes(new TextEncoder().encode("not an image"), "image/png")).toBe(false);
    expect(MAX_ASSET_BYTES).toBe(10 * 1024 * 1024);
  });
});
