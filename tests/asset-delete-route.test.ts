import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({auth:vi.fn(),find:vi.fn(),references:vi.fn(),deleteRecord:vi.fn(),deleteRemote:vi.fn(),setState:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/assets/server/asset.repository",()=>({findAssetByIdAndOwner:mocks.find,findAssetProjectReferences:mocks.references,deleteAssetRecord:mocks.deleteRecord,setAssetDeletionState:mocks.setState}));
vi.mock("@/lib/assets/storage",()=>({AssetStorageConfigurationError:class extends Error{},getAssetStorage:()=>({deleteAsset:mocks.deleteRemote})}));
import { DELETE } from "@/app/api/assets/[assetId]/route";

describe("asset deletion authorization and references",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.find.mockResolvedValue({id:"asset-a",ownerId:"owner-a",publicUrl:"https://blob.test/a",storageKey:"assets/a"});mocks.references.mockResolvedValue([]);mocks.deleteRemote.mockResolvedValue(undefined);mocks.deleteRecord.mockResolvedValue({count:1});mocks.setState.mockResolvedValue({count:1})});
  it("rejects unauthenticated deletion",async()=>{mocks.auth.mockResolvedValue(null);expect((await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})})).status).toBe(401)});
  it("uses the session owner when loading the asset",async()=>{await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})});expect(mocks.find).toHaveBeenCalledWith("asset-a","owner-a")});
  it("returns 409 and keeps storage when referenced",async()=>{mocks.references.mockResolvedValue([{id:"project-a",name:"Site"}]);const response=await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})});expect(response.status).toBe(409);expect(mocks.deleteRemote).not.toHaveBeenCalled();expect((await response.json()).referenceCount).toBe(1)});
  it("marks a storage failure resumable and succeeds on retry",async()=>{mocks.deleteRemote.mockRejectedValueOnce(new Error("blob unavailable")).mockResolvedValueOnce(undefined);expect((await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})})).status).toBe(502);expect(mocks.setState).toHaveBeenCalledWith("asset-a","owner-a","delete_failed",expect.any(String));expect((await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})})).status).toBe(204)});
  it("never leaves an active record after database finalization fails",async()=>{mocks.deleteRecord.mockRejectedValue(new Error("db unavailable"));expect((await DELETE(new Request("http://test",{method:"DELETE"}),{params:Promise.resolve({assetId:"asset-a"})})).status).toBe(502);expect(mocks.setState).toHaveBeenCalledWith("asset-a","owner-a","delete_failed",expect.stringContaining("Database"))});
});
