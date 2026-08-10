import { describe, expect, it } from "vitest";
import { initialWebsite } from "@/data/initialWebsite";
import { findLegacyAssetReferences } from "@/features/publishing/assets";
import { RESERVED_SLUGS, slugify, slugSchema } from "@/features/publishing/slug";
import { isSupportedImageBytes, MAX_ASSET_BYTES } from "@/lib/assets/validation";
import { websiteSchema } from "@/schemas/website.schema";
import { isSupportedCssColor } from "@/schemas/shared.schema";
import { compactWebsiteAssetReferences, createAssetReference, replaceWebsiteAssetReferences } from "@/utils/assetStorage";
import { createAutosaveCoordinator } from "@/utils/autosaveCoordinator";
import { hashGitHubNonce, signGitHubState, verifyGitHubState } from "@/lib/github/state";
import type { UploadedImageAsset } from "@/types/uploadedAsset";
import { uploadAssetWithRollback } from "@/features/assets/asset.service";
import { verifyGitHubWebhookSignature } from "@/lib/github/webhook";
import { createHmac } from "node:crypto";

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
  it("never compacts synchronized HTTPS assets back to local references", () => {
    const url="https://blob.example.test/image.webp";
    const website={...initialWebsite,sections:initialWebsite.sections.map((section,index)=>index===0?{...section,props:{...section.props,imageUrl:url}}:section)};
    const serverAsset:UploadedImageAsset={id:"server-1",ownerId:"owner",name:"image.webp",mimeType:"image/webp",size:10,width:1,height:1,dataUrl:url,createdAt:1,synchronized:true};
    const serialized=compactWebsiteAssetReferences(website,[serverAsset]);
    expect(serialized.sections[0].props.imageUrl).toBe(url);
    expect(findLegacyAssetReferences(serialized)).toEqual([]);
  });
  it("compacts only local assets and replaces every occurrence during migration",()=>{
    const local:UploadedImageAsset={id:"local-1",ownerId:"owner",name:"x.png",mimeType:"image/png",size:10,width:1,height:1,dataUrl:"data:image/png;base64,iVBORw0KGgo=",createdAt:1};
    const website={...initialWebsite,theme:{...initialWebsite.theme,backgroundImageUrl:local.dataUrl},sections:initialWebsite.sections.map((section,index)=>index===0?{...section,props:{...section.props,imageUrl:local.dataUrl}}:section)};
    const compacted=compactWebsiteAssetReferences(website,[local]);
    expect(findLegacyAssetReferences(compacted)).toEqual([createAssetReference(local.id)]);
    const migrated=replaceWebsiteAssetReferences(compacted,new Map([[createAssetReference(local.id),"https://blob.example.test/x.png"]]));
    expect(findLegacyAssetReferences(migrated)).toEqual([]);
    expect(migrated.theme.backgroundImageUrl).toBe("https://blob.example.test/x.png");
  });
});

describe("strict CSS colors",()=>{
  it.each(["#fff","#11223344","rgb(0, 128, 255)","rgba(10%, 20%, 30%, .5)","hsl(360, 100%, 50%)","hsla(0, 0%, 0%, 25%)","var(--httpmaker-accent)","transparent"])("accepts %s",value=>expect(isSupportedCssColor(value)).toBe(true));
  it.each(["rgb(256,0,0)","rgba(0,0,0,1.1)","hsl(0,101%,50%)","rgb(0);background:url(https://example.com/x)","red; color:white","url(x)","expression(alert(1))","var(--unapproved-token)","#12"])("rejects %s",value=>expect(isSupportedCssColor(value)).toBe(false));
});

describe("autosave ordering and retry",()=>{
  it("supersedes an older in-flight operation",()=>{const coordinator=createAutosaveCoordinator();const old=coordinator.begin();const latest=coordinator.begin();expect(old.signal.aborted).toBe(true);expect(coordinator.isCurrent(old)).toBe(false);expect(coordinator.isCurrent(latest)).toBe(true)});
  it("a retry becomes the only operation allowed to set status",()=>{const coordinator=createAutosaveCoordinator();const failed=coordinator.begin();const retry=coordinator.begin();expect(coordinator.isCurrent(failed)).toBe(false);expect(coordinator.isCurrent(retry)).toBe(true)});
});

describe("GitHub connection state",()=>{
  const secret="test-secret-that-is-at-least-thirty-two-characters";
  it("validates user, nonce and expiry data",()=>{const state=signGitHubState({userId:"user-a",nonce:"nonce",expiresAt:2000},secret);expect(verifyGitHubState(state,secret,1000)).toEqual({userId:"user-a",nonce:"nonce",expiresAt:2000});expect(hashGitHubNonce("nonce")).toHaveLength(64)});
  it("rejects tampering and expiry",()=>{const state=signGitHubState({userId:"user-a",nonce:"nonce",expiresAt:2000},secret);expect(verifyGitHubState(`${state}x`,secret,1000)).toBeNull();expect(verifyGitHubState(state,secret,2001)).toBeNull()});
});

describe("asset storage lifecycle",()=>{
  it("returns the database record after storage succeeds",async()=>{const storage={putAsset:async()=>({storageKey:"assets/random",publicUrl:"https://blob.test/random"}),deleteAsset:async()=>{throw new Error("unexpected")}};const result=await uploadAssetWithRollback({ownerId:"owner",file:new Blob(["x"]),name:"x.png",mimeType:"image/png",size:1},{storage,createRecord:async data=>({id:"asset",...data}),key:()=>"random"});expect(result.id).toBe("asset");expect(result.publicUrl).toMatch(/^https:/)});
  it("deletes the uploaded object when database creation fails",async()=>{const deleted:string[]=[];const storage={putAsset:async()=>({storageKey:"assets/random",publicUrl:"https://blob.test/random"}),deleteAsset:async(key:string)=>{deleted.push(key)}};await expect(uploadAssetWithRollback({ownerId:"owner",file:new Blob(["x"]),name:"x.png",mimeType:"image/png",size:1},{storage,createRecord:async()=>{throw new Error("db failed")},key:()=>"random"})).rejects.toThrow("db failed");expect(deleted).toEqual(["assets/random"])});
});

describe("GitHub webhook signatures",()=>{
  it("accepts only the matching HMAC",()=>{const body=JSON.stringify({action:"deleted"});const secret="webhook-secret";const signature=`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`;expect(verifyGitHubWebhookSignature(body,signature,secret)).toBe(true);expect(verifyGitHubWebhookSignature(`${body}x`,signature,secret)).toBe(false)});
});
