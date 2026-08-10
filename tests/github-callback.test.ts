import { beforeEach, describe, expect, it, vi } from "vitest";
import { signGitHubState } from "@/lib/github/state";

const mocks=vi.hoisted(()=>({auth:vi.fn(),consume:vi.fn(),findExternal:vi.fn(),upsert:vi.fn(),request:vi.fn(),client:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/github/server/github.repository",()=>({consumeGitHubNonce:mocks.consume,findGitHubInstallationByExternalId:mocks.findExternal,upsertGitHubInstallation:mocks.upsert}));
vi.mock("@/lib/github/config",()=>({isGitHubAppConfigured:()=>true,githubStateSecret:()=>"test-secret-that-is-at-least-thirty-two-characters"}));
vi.mock("@/lib/github/get-installation-client",()=>({getInstallationClient:mocks.client}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import { GET } from "@/app/api/github/installations/callback/route";

const secret="test-secret-that-is-at-least-thirty-two-characters";
const state=()=>signGitHubState({userId:"owner-a",nonce:"nonce",expiresAt:Date.now()+60_000},secret);
describe("GitHub installation callback",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.redirect.mockImplementation((url:string)=>{throw new Error(`redirect:${url}`)});mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.consume.mockResolvedValue({count:1});mocks.findExternal.mockResolvedValue(null);mocks.request.mockResolvedValue({data:{account:{id:7,login:"acme",type:"Organization"}}});mocks.client.mockResolvedValue({request:mocks.request});mocks.upsert.mockResolvedValue({id:"installation-a"})});
  it("verifies GitHub before storing the installation",async()=>{await expect(GET(new Request(`http://test/api/github/installations/callback?installation_id=123&state=${encodeURIComponent(state())}`))).rejects.toThrow("github=connected");expect(mocks.request).toHaveBeenCalledWith("GET /installation");expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ownerId:"owner-a",installationId:"123",accountLogin:"acme"}));expect(mocks.request.mock.invocationCallOrder[0]).toBeLessThan(mocks.upsert.mock.invocationCallOrder[0])});
  it("rejects a replayed nonce before contacting GitHub",async()=>{mocks.consume.mockResolvedValue({count:0});await expect(GET(new Request(`http://test/api/github/installations/callback?installation_id=123&state=${encodeURIComponent(state())}`))).rejects.toThrow("expired-or-replayed");expect(mocks.client).not.toHaveBeenCalled()});
  it("rejects an installation already owned by another user",async()=>{mocks.findExternal.mockResolvedValue({ownerId:"owner-b"});await expect(GET(new Request(`http://test/api/github/installations/callback?installation_id=123&state=${encodeURIComponent(state())}`))).rejects.toThrow("already-owned");expect(mocks.client).not.toHaveBeenCalled()});
});
