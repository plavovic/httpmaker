import {describe,expect,it} from "vitest";
import {friendlyAuthError} from "@/lib/auth-errors";
import {googleOAuthConfig,isVerifiedGoogleProfile} from "@/lib/server/oauth-config";
import {authProviders} from "@/lib/server/auth-providers";
import {safeCallbackPath} from "@/lib/server/route-policy";
import {clientSession} from "@/lib/auth-session";
import {readFileSync} from "node:fs";
import {join} from "node:path";

describe("Google OAuth configuration",()=>{
  it("keeps Google optional when both values are absent",()=>expect(googleOAuthConfig({})).toEqual({enabled:false}));
  it("rejects an ID without a secret",()=>expect(()=>googleOAuthConfig({AUTH_GOOGLE_ID:"id"})).toThrow("configured together"));
  it("rejects a secret without an ID",()=>expect(()=>googleOAuthConfig({AUTH_GOOGLE_SECRET:"secret"})).toThrow("configured together"));
  it("enables Google only with the complete server-side pair",()=>expect(googleOAuthConfig({AUTH_GOOGLE_ID:"id",AUTH_GOOGLE_SECRET:"secret"})).toEqual({enabled:true,clientId:"id",clientSecret:"secret"}));
  it("registers GitHub alone or GitHub plus Google",()=>{expect(authProviders({})).toHaveLength(1);const configured=authProviders({AUTH_GOOGLE_ID:"id",AUTH_GOOGLE_SECRET:"secret"});expect(configured.map(provider=>typeof provider==="function"?provider({}).id:provider.id)).toEqual(["github","google"])});
});

describe("Google identity policy",()=>{
  it("accepts verified Google and preserves GitHub",()=>{expect(isVerifiedGoogleProfile({provider:"google"},{email_verified:true})).toBe(true);expect(isVerifiedGoogleProfile({provider:"github"},{})).toBe(true)});
  it("rejects unverified or missing Google verification",()=>{expect(isVerifiedGoogleProfile({provider:"google"},{email_verified:false})).toBe(false);expect(isVerifiedGoogleProfile({provider:"google"},{})).toBe(false)});
  it("returns only the database user ID and no provider tokens",()=>{const result=clientSession({user:{name:"A",email:"a@example.test"},expires:"2099-01-01"},{id:"database-user",name:"A",email:"a@example.test",image:null});expect(result.user?.id).toBe("database-user");expect(result).not.toHaveProperty("access_token");expect(result).not.toHaveProperty("refresh_token")});
  it("keeps Auth.js safe account linking and generic account uniqueness",()=>{const source=readFileSync(join(process.cwd(),"auth.ts"),"utf8");const schema=readFileSync(join(process.cwd(),"prisma/schema.prisma"),"utf8");expect(source).not.toContain("allowDangerousEmailAccountLinking");expect(schema).toContain("@@unique([provider, providerAccountId])")});
});

describe("login safety",()=>{
  it.each(["OAuthAccountNotLinked","OAuthCallbackError","AccessDenied","Configuration"])("maps %s without reflecting it",code=>expect(friendlyAuthError(code)).not.toContain(code));
  it("does not reflect unknown query values",()=>expect(friendlyAuthError("<script>alert(1)</script>")).toBe("Sign-in could not be completed. Please try again."));
  it.each(["https://evil.example","//evil.example","/\\evil","/%0aevil","javascript:alert(1)"])("rejects callback %s",value=>expect(safeCallbackPath(value)).toBe("/dashboard"));
});
