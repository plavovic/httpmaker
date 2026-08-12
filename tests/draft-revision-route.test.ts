import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialWebsite } from "@/data/initialWebsite";

const mocks=vi.hoisted(()=>({auth:vi.fn(),find:vi.fn(),update:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/projects/server/project.repository",()=>({findProjectByIdAndOwner:mocks.find,updateProject:mocks.update,deleteProject:vi.fn(),setProjectDeletionState:vi.fn()}));
vi.mock("@/features/assets/server/asset.repository",()=>({listProjectAssetStorageKeys:vi.fn(),deleteAssetRecord:vi.fn(),setAssetDeletionState:vi.fn()}));
import { PATCH } from "@/app/api/projects/[projectId]/route";

const context={params:Promise.resolve({projectId:"project-a"})};
const save=(revision?:number)=>PATCH(new Request("http://test",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({website:initialWebsite,...(revision===undefined?{}:{expectedRevision:revision})})}),context);

describe("ordered draft writes",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.update.mockResolvedValue({count:1});mocks.find.mockResolvedValue({id:"project-a",ownerId:"owner-a",website:initialWebsite,draftRevision:4})});
  it("requires a server revision for every draft write",async()=>expect((await save()).status).toBe(400));
  it("passes the expected revision into the conditional update",async()=>{expect((await save(3)).status).toBe(200);expect(mocks.update).toHaveBeenCalledWith("project-a","owner-a",expect.objectContaining({expectedRevision:3}))});
  it("returns a clear conflict without overwriting a newer draft",async()=>{mocks.update.mockResolvedValue({count:0});const response=await save(2);expect(response.status).toBe(409);expect(await response.json()).toEqual(expect.objectContaining({code:"DRAFT_CONFLICT",currentRevision:4}))});
});
