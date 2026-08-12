import { auth } from "@/auth";
import { findMigrationAsset } from "@/features/assets/server/asset.repository";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { MAX_ASSET_BYTES, SUPPORTED_IMAGE_TYPES } from "@/lib/assets/validation";
import { signUploadIntent } from "@/lib/assets/upload-intent";
import { assetUploadRateLimiter, rateLimitResponse } from "@/lib/server/rate-limit";
import { requireSameOrigin } from "@/lib/server/same-origin";

const safeName = (name: string) => name.replace(/[\r\n]/g, " ").replace(/[^\p{L}\p{N}._ ()-]/gu, "_").slice(0, 255) || "image";
const extension: Record<string,string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export async function POST(request: Request) {
  const originError = requireSameOrigin(request); if (originError) return originError;
  const ownerId = (await auth())?.user?.id; if (!ownerId) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const rate = await assetUploadRateLimiter.consume(ownerId); if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);
  let input: { projectId?: string; migrationKey?: string; name?: string; mimeType?: string; size?: number };
  try { input = await request.json(); } catch { return Response.json({ error: "Invalid upload request." }, { status: 400 }); }
  const projectId = input.projectId?.trim() || undefined; const migrationKey = input.migrationKey?.trim() || undefined;
  const mimeType = input.mimeType?.trim() || ""; const size = Number(input.size); const name = safeName(input.name?.trim() || "image");
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType as typeof SUPPORTED_IMAGE_TYPES[number])) return Response.json({ error: "Unsupported image type." }, { status: 415 });
  if (!Number.isInteger(size) || size < 1) return Response.json({ error: "Invalid image size." }, { status: 400 });
  if (size > MAX_ASSET_BYTES) return Response.json({ error: "Image exceeds the 10 MB limit." }, { status: 413 });
  if (migrationKey && (!projectId || migrationKey.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(migrationKey))) return Response.json({ error: "Invalid migration identity." }, { status: 400 });
  if (projectId && !(await findProjectByIdAndOwner(projectId, ownerId))) return Response.json({ error: "Project not found." }, { status: 404 });
  if (projectId && migrationKey) { const existing = await findMigrationAsset(ownerId, projectId, migrationKey); if (existing) return Response.json({ asset: existing, reused: true }); }
  const storageKey = `assets/${crypto.randomUUID()}.${extension[mimeType]}`;
  const tokenPayload = signUploadIntent({ ownerId, ...(projectId ? { projectId } : {}), ...(migrationKey ? { migrationKey } : {}), storageKey, name, mimeType, size, expiresAt: Date.now() + 10 * 60_000 });
  return Response.json({ storageKey, tokenPayload });
}
