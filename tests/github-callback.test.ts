import { beforeEach, describe, expect, it, vi } from "vitest";
import { signGitHubState } from "@/lib/github/state";

const mocks=vi.hoisted(()=>({auth:vi.fn(),consume:vi.fn(),findExternal:vi.fn(),upsert:vi.fn(),listAuthorized:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/github/server/github.repository",()=>({consumeGitHubNonce:mocks.consume,findGitHubInstallationByExternalId:mocks.findExternal,upsertGitHubInstallation:mocks.upsert}));
vi.mock("@/lib/github/config",()=>({isGitHubAppConfigured:()=>true,githubStateSecret:()=>"test-secret-that-is-at-least-thirty-two-characters"}));
vi.mock("@/lib/github/user-authorization",()=>({listInstallationsAuthorizedForCode:mocks.listAuthorized}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import { GET } from "@/app/api/github/installations/callback/route";

const secret="test-secret-that-is-at-least-thirty-two-characters";
const state=()=>signGitHubState({userId:"owner-a",nonce:"nonce",expiresAt:Date.now()+60_000},secret);
const request=()=>new Request(`http://test/api/github/installations/callback?installation_id=123&code=short-lived-code&state=${encodeURIComponent(state())}`);

describe("GitHub installation callback",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.redirect.mockImplementation((url:string)=>{throw new Error(`redirect:${url}`)});mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.consume.mockResolvedValue({count:1});mocks.findExternal.mockResolvedValue(null);mocks.listAuthorized.mockResolvedValue([{id:123,account:{id:7,login:"acme",type:"Organization"}}]);mocks.upsert.mockResolvedValue({id:"installation-a"})});
  it("stores an installation only after user-token authorization",async()=>{await expect(GET(request())).rejects.toThrow("github=connected");expect(mocks.listAuthorized).toHaveBeenCalledWith("short-lived-code");expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ownerId:"owner-a",installationId:"123",accountLogin:"acme"}));expect(mocks.listAuthorized.mock.invocationCallOrder[0]).toBeLessThan(mocks.upsert.mock.invocationCallOrder[0])});
  it("rejects an app-valid installation absent from the user's accessible list",async()=>{mocks.listAuthorized.mockResolvedValue([{id:999,account:{id:8,login:"other",type:"User"}}]);await expect(GET(request())).rejects.toThrow("installation-not-authorized");expect(mocks.upsert).not.toHaveBeenCalled()});
  it("rejects a replay before exchanging the code",async()=>{mocks.consume.mockResolvedValue({count:0});await expect(GET(request())).rejects.toThrow("expired-or-replayed");expect(mocks.listAuthorized).not.toHaveBeenCalled()});
  it("rejects an installation already owned by another user",async()=>{mocks.findExternal.mockResolvedValue({ownerId:"owner-b"});await expect(GET(request())).rejects.toThrow("already-owned");expect(mocks.upsert).not.toHaveBeenCalled()});
});
