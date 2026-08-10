import { auth } from "@/auth";
import { createAssetRecord, listAssetsByOwner } from "@/features/assets/server/asset.repository";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { AssetStorageConfigurationError, getAssetStorage } from "@/lib/assets/storage";
import { isSupportedImageBytes, MAX_ASSET_BYTES, SUPPORTED_IMAGE_TYPES } from "@/lib/assets/validation";

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
  try { form = await request.formData(); } catch { return Response.json({ error: "Upload must be multipart form data." }, { status: 400 }); }
  const file = form.get("file");
  const projectId = typeof form.get("projectId") === "string" ? String(form.get("projectId")).trim() : "";
  if (!(file instanceof File)) return Response.json({ error: "An image file is required." }, { status: 400 });
  if (file.size > MAX_ASSET_BYTES) return Response.json({ error: "Image exceeds the 10 MB limit." }, { status: 413 });
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) return Response.json({ error: "Unsupported image type." }, { status: 415 });
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!isSupportedImageBytes(bytes, file.type)) return Response.json({ error: "File contents do not match the declared image type." }, { status: 415 });
  if (projectId && !(await findProjectByIdAndOwner(projectId, ownerId))) return Response.json({ error: "Project not found." }, { status: 404 });
  let uploaded: { storageKey: string; publicUrl: string } | undefined;
  try {
    const storage = getAssetStorage();
    uploaded = await storage.putAsset({ storageKey: `assets/${crypto.randomUUID()}`, data: file, contentType: file.type });
    const asset = await createAssetRecord({ ownerId, ...(projectId ? { projectId } : {}), ...uploaded, name: safeName(file.name), mimeType: file.type, size: file.size });
    return Response.json({ asset }, { status: 201 });
  } catch (error) {
    if (uploaded) try { await getAssetStorage().deleteAsset(uploaded.storageKey); } catch { /* best-effort rollback */ }
    if (error instanceof AssetStorageConfigurationError) return Response.json({ error: error.message }, { status: 503 });
    console.error("Asset upload failed:", error);
    return Response.json({ error: "Image upload failed." }, { status: 502 });
  }
}
