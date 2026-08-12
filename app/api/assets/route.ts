import { auth } from "@/auth";
import { createAssetRecord, findMigrationAsset, listAssetsByOwner } from "@/features/assets/server/asset.repository";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { AssetStorageConfigurationError, getAssetStorage } from "@/lib/assets/storage";
import { isSupportedImageBytes, MAX_ASSET_BYTES, SUPPORTED_IMAGE_TYPES } from "@/lib/assets/validation";
import { runIdempotentAssetMigration, uploadAssetWithRollback } from "@/features/assets/asset.service";
import { readFormDataBody, RequestBodyTooLargeError } from "@/lib/server/request";

const safeName = (name: string) => name.replace(/[\r\n]/g, " ").slice(0, 255) || "image";

export async function GET(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId")?.trim() || undefined;
  if (projectId && !(await findProjectByIdAndOwner(projectId, ownerId))) return Response.json({ error: "Project not found." }, { status: 404 });
  return Response.json({ assets: await listAssetsByOwner(ownerId, projectId) });
}

export async function POST(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ASSET_BYTES + 100_000) return Response.json({ error: "Image exceeds the 10 MB limit." }, { status: 413 });
  let form: FormData;
  try { form = await readFormDataBody(request, MAX_ASSET_BYTES + 100_000); } catch (error) { return Response.json({ error: error instanceof RequestBodyTooLargeError ? "Image exceeds the 10 MB limit." : "Upload must be multipart form data." }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 }); }
  const file = form.get("file");
  const projectId = typeof form.get("projectId") === "string" ? String(form.get("projectId")).trim() : "";
  const migrationKey = typeof form.get("migrationKey") === "string" ? String(form.get("migrationKey")).trim() : "";
  if (migrationKey && (!projectId || migrationKey.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(migrationKey))) return Response.json({ error: "Invalid migration identity." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "An image file is required." }, { status: 400 });
  if (file.size > MAX_ASSET_BYTES) return Response.json({ error: "Image exceeds the 10 MB limit." }, { status: 413 });
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) return Response.json({ error: "Unsupported image type." }, { status: 415 });
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!isSupportedImageBytes(bytes, file.type)) return Response.json({ error: "File contents do not match the declared image type." }, { status: 415 });
  if (projectId && !(await findProjectByIdAndOwner(projectId, ownerId))) return Response.json({ error: "Project not found." }, { status: 404 });
  try {
    const storage = getAssetStorage();
    const upload = () => uploadAssetWithRollback({ ownerId, ...(projectId ? { projectId } : {}), ...(migrationKey ? { migrationKey } : {}), file, name: safeName(file.name), mimeType: file.type, size: file.size }, { storage, createRecord: createAssetRecord });
    if (projectId && migrationKey) {
      const result = await runIdempotentAssetMigration({ ownerId, projectId, migrationKey }, { findExisting: () => findMigrationAsset(ownerId, projectId, migrationKey), upload });
      return Response.json(result, { status: result.reused ? 200 : 201 });
    }
    return Response.json({ asset: await upload() }, { status: 201 });
  } catch (error) {
    if (error instanceof AssetStorageConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    console.error("Asset upload failed:", error);
    return Response.json({ error: "Image upload failed." }, { status: 502 });
  }
}
