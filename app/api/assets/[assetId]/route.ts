import { auth } from "@/auth";
import { deleteAssetRecord, findAssetByIdAndOwner, findAssetProjectReferences, setAssetDeletionState } from "@/features/assets/server/asset.repository";
import { AssetStorageConfigurationError, getAssetStorage } from "@/lib/assets/storage";

export async function DELETE(_request: Request, context: { params: Promise<{ assetId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { assetId } = await context.params;
  const asset = await findAssetByIdAndOwner(assetId, ownerId);
  if (!asset) return Response.json({ error: "Asset not found." }, { status: 404 });
  const references = await findAssetProjectReferences(ownerId, asset.publicUrl);
  if (references.length) return Response.json({ error: "This image is still used by a draft or published website. Replace or remove it before deleting.", referenceCount: references.length, projects: references }, { status: 409 });
  try {
    await setAssetDeletionState(asset.id, ownerId, "deleting");
    await getAssetStorage().deleteAsset(asset.storageKey);
    try { await deleteAssetRecord(asset.id, ownerId); }
    catch (error) { await setAssetDeletionState(asset.id, ownerId, "delete_failed", "Database finalization failed after remote cleanup."); throw error; }
    return new Response(null, { status: 204 });
  } catch (error) {
    await setAssetDeletionState(asset.id, ownerId, "delete_failed", "Remote or database cleanup failed; retry is required.").catch(() => undefined);
    if (error instanceof AssetStorageConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    console.error("Asset deletion failed:", error);
    return Response.json({ error: "Asset deletion is incomplete and can be retried.", state: "delete_failed" }, { status: 502 });
  }
}
