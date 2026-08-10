import { auth } from "@/auth";
import { deleteAssetRecord, findAssetByIdAndOwner } from "@/features/assets/server/asset.repository";
import { AssetStorageConfigurationError, getAssetStorage } from "@/lib/assets/storage";

export async function DELETE(_request: Request, context: { params: Promise<{ assetId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { assetId } = await context.params;
  const asset = await findAssetByIdAndOwner(assetId, ownerId);
  if (!asset) return Response.json({ error: "Asset not found." }, { status: 404 });
  try {
    await getAssetStorage().deleteAsset(asset.storageKey);
    await deleteAssetRecord(asset.id, ownerId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AssetStorageConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    console.error("Asset deletion failed:", error);
    return Response.json({ error: "Asset deletion failed; the database record was kept for retry." }, { status: 502 });
  }
}
