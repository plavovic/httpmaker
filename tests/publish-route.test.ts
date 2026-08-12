import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialWebsite } from "@/data/initialWebsite";

const mocks=vi.hoisted(()=>({auth:vi.fn(),preflight:vi.fn(),publish:vi.fn(),unpublish:vi.fn(),findIcon:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/publishing/server/preflight",()=>({prepareProjectPublication:mocks.preflight}));
vi.mock("@/features/projects/server/project.repository",()=>({publishProject:mocks.publish,unpublishProject:mocks.unpublish}));
vi.mock("@/features/assets/server/asset.repository",()=>({findProjectAssetByPublicUrl:mocks.findIcon}));
import { DELETE, POST } from "@/app/api/projects/[projectId]/publish/route";

const context={params:Promise.resolve({projectId:"project-a"})};
const request=(body=JSON.stringify({title:"My site",iconUrl:null}),headers:Record<string,string>={})=>new Request("http://test/api/projects/project-a/publish",{method:"POST",headers:{"content-type":"application/json",...headers},body});

describe("publication route ownership and preflight",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.preflight.mockResolvedValue({success:true,project:{id:"project-a",draftRevision:4},website:initialWebsite,slug:"my-site"});mocks.publish.mockResolvedValue({slug:"my-site",isPublished:true,publishedAt:new Date("2026-01-01")});mocks.unpublish.mockResolvedValue({count:1})});
  it("rejects unauthenticated publish",async()=>{mocks.auth.mockResolvedValue(null);expect((await POST(request(),context)).status).toBe(401)});
  it("returns the owner-scoped preflight result for a non-owner",async()=>{mocks.preflight.mockResolvedValue({success:false,status:404,body:{error:"Project not found."}});expect((await POST(request(),context)).status).toBe(404)});
  it("blocks unresolved local assets",async()=>{mocks.preflight.mockResolvedValue({success:false,status:422,body:{error:"Upload local legacy assets before publishing.",unresolvedAssetCount:1}});const response=await POST(request(),context);expect(response.status).toBe(422);expect((await response.json()).error.details.unresolvedAssetCount).toBe(1)});
  it("publishes only the validated preflight snapshot",async()=>{const response=await POST(request(),context);expect(response.status).toBe(200);expect(mocks.publish).toHaveBeenCalledWith("project-a","owner-a","my-site",initialWebsite,4,{title:"My site",iconUrl:null})});
  it("rejects an icon that is not an active asset owned by the project",async()=>{mocks.findIcon.mockResolvedValue(null);const response=await POST(request(JSON.stringify({title:"My site",iconUrl:"https://assets.test/icon.png"})),context);expect(response.status).toBe(400);expect(mocks.publish).not.toHaveBeenCalled()});
  it("returns 400 for malformed JSON and 413 for oversized bodies",async()=>{expect((await POST(request("{"),context)).status).toBe(400);expect((await POST(request("{}",{"content-length":"9000"}),context)).status).toBe(413)});
  it("unpublishes only through the owner-scoped repository call",async()=>{const response=await DELETE(new Request("http://test",{method:"DELETE"}),context);expect(response.status).toBe(204);expect(mocks.unpublish).toHaveBeenCalledWith("project-a","owner-a")});
});
