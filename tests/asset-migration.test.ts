import { describe, expect, it, vi } from "vitest";
import { runIdempotentAssetMigration, uploadAssetWithRollback } from "@/features/assets/asset.service";

describe("legacy asset migration recovery",()=>{
  it("reuses the owner/project-scoped record after a partial draft-save failure",async()=>{const existing={id:"asset-a",publicUrl:"https://blob.test/a"};const upload=vi.fn();const result=await runIdempotentAssetMigration({ownerId:"owner-a",projectId:"project-a",migrationKey:"local-a"},{findExisting:async()=>existing,upload});expect(result).toEqual({asset:existing,reused:true});expect(upload).not.toHaveBeenCalled()});
  it("uploads once for a new stable identity",async()=>{const upload=vi.fn().mockResolvedValue({id:"asset-a"});const result=await runIdempotentAssetMigration({ownerId:"owner-a",projectId:"project-a",migrationKey:"local-a"},{findExisting:async()=>null,upload});expect(result.reused).toBe(false);expect(upload).toHaveBeenCalledTimes(1)});
  it("attempts remote rollback when database persistence fails",async()=>{const remove=vi.fn().mockRejectedValue(new Error("rollback unavailable"));await expect(uploadAssetWithRollback({ownerId:"owner-a",projectId:"project-a",migrationKey:"local-a",file:new Blob(["x"]),name:"x.png",mimeType:"image/png",size:1},{storage:{putAsset:async()=>({storageKey:"assets/a",publicUrl:"https://blob.test/a"}),deleteAsset:remove},createRecord:async()=>{throw new Error("database unavailable")}})).rejects.toThrow("database unavailable");expect(remove).toHaveBeenCalledWith("assets/a")});
});
