import { auth } from "@/auth";
import { findAssetByStorageKey, listAssetsByOwner } from "@/features/assets/server/asset.repository";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";

export async function GET(request: Request) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const storageKey = url.searchParams.get("storageKey")?.trim();
  if (storageKey) return Response.json({ asset: await findAssetByStorageKey(ownerId, storageKey) });
  const projectId = url.searchParams.get("projectId")?.trim() || undefined;
  if (projectId && !(await findProjectByIdAndOwner(projectId, ownerId))) return Response.json({ error: "Project not found." }, { status: 404 });
  return Response.json({ assets: await listAssetsByOwner(ownerId, projectId) });
}

export async function POST() {
  return Response.json({ error: "Multipart uploads are disabled. Use the direct Blob upload flow." }, { status: 410 });
}
