import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { createAssetRecord, findAssetByStorageKey, findMigrationAsset } from "@/features/assets/server/asset.repository";
import { getAssetStorage } from "@/lib/assets/storage";
import { isSupportedImageBytes, MAX_ASSET_BYTES } from "@/lib/assets/validation";
import { verifyUploadIntent } from "@/lib/assets/upload-intent";
import { requireSameOrigin } from "@/lib/server/same-origin";

export async function POST(request: Request) {
  let body: HandleUploadBody; try { body = await request.json() as HandleUploadBody; } catch { return Response.json({ error: "Invalid upload request." }, { status: 400 }); }
  try {
    const result = await handleUpload({ request, body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const originError = requireSameOrigin(request); if (originError) throw new Error("Upload origin was rejected.");
        const ownerId = (await auth())?.user?.id; if (!ownerId) throw new Error("Authentication is required.");
        const intent = verifyUploadIntent(clientPayload); if (intent.ownerId !== ownerId || intent.storageKey !== pathname) throw new Error("Upload authorization does not match this request.");
        return { allowedContentTypes: [intent.mimeType], maximumSizeInBytes: Math.min(intent.size, MAX_ASSET_BYTES), addRandomSuffix: false, allowOverwrite: false, validUntil: intent.expiresAt, tokenPayload: clientPayload };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const intent = verifyUploadIntent(tokenPayload); const storage = getAssetStorage();
        if (blob.pathname !== intent.storageKey) { await storage.deleteAsset(blob.pathname); throw new Error("Uploaded object identity did not match its authorization."); }
        if (await findAssetByStorageKey(intent.ownerId, intent.storageKey)) return;
        if (intent.projectId && intent.migrationKey && await findMigrationAsset(intent.ownerId, intent.projectId, intent.migrationKey)) { await storage.deleteAsset(intent.storageKey); return; }
        const inspected = await storage.inspectAsset(intent.storageKey);
        if (inspected.size !== intent.size || inspected.size > MAX_ASSET_BYTES || inspected.contentType !== intent.mimeType || !isSupportedImageBytes(inspected.bytes, intent.mimeType)) { await storage.deleteAsset(intent.storageKey); throw new Error("Uploaded image validation failed."); }
        try { await createAssetRecord({ ownerId: intent.ownerId, ...(intent.projectId ? { projectId: intent.projectId } : {}), ...(intent.migrationKey ? { migrationKey: intent.migrationKey } : {}), storageKey: inspected.storageKey, publicUrl: inspected.publicUrl, name: intent.name, mimeType: intent.mimeType, size: intent.size }); }
        catch (error) { if (!(await findAssetByStorageKey(intent.ownerId, intent.storageKey))) await storage.deleteAsset(intent.storageKey); throw error; }
      },
    });
    return Response.json(result);
  } catch (error) { console.error("Blob client upload failed:", error instanceof Error ? error.message : "unknown error"); return Response.json({ error: "Image upload authorization or validation failed." }, { status: 400 }); }
}
