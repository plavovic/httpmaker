import "server-only";

import { prisma } from "@/lib/prisma";

export const listAssetsByOwner = (ownerId: string, projectId?: string) => prisma.asset.findMany({
  where: { ownerId, ...(projectId ? { projectId } : {}) },
  orderBy: { createdAt: "desc" },
  select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true },
});

export const createAssetRecord = (data: { ownerId: string; projectId?: string; migrationKey?: string; storageKey: string; publicUrl: string; name: string; mimeType: string; size: number; width?: number; height?: number }) => prisma.asset.create({ data, select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true } });
export const findMigrationAsset = (ownerId: string, projectId: string, migrationKey: string) => prisma.asset.findFirst({ where: { ownerId, projectId, migrationKey, deletionState: "active" }, select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true } });
export const findAssetByStorageKey = (ownerId: string, storageKey: string) => prisma.asset.findFirst({ where: { ownerId, storageKey, deletionState: "active" }, select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true } });
export const findAssetByIdAndOwner = (id: string, ownerId: string) => prisma.asset.findFirst({ where: { id, ownerId } });
export const findProjectAssetByPublicUrl = (publicUrl: string, projectId: string, ownerId: string) => prisma.asset.findFirst({ where: { publicUrl, projectId, ownerId, deletionState: "active" }, select: { publicUrl: true, mimeType: true } });
export const deleteAssetRecord = (id: string, ownerId: string) => prisma.asset.deleteMany({ where: { id, ownerId } });
export const setAssetDeletionState = (id: string, ownerId: string, deletionState: string, deletionError: string | null = null) => prisma.asset.updateMany({ where: { id, ownerId }, data: { deletionState, deletionError } });
export const listProjectAssetStorageKeys = (projectId: string, ownerId: string) => prisma.asset.findMany({ where: { projectId, ownerId }, select: { id: true, storageKey: true, deletionState: true } });

const containsExactString = (value: unknown, target: string): boolean => {
  if (value === target) return true;
  if (Array.isArray(value)) return value.some((item) => containsExactString(item, target));
  return Boolean(value && typeof value === "object" && Object.values(value).some((item) => containsExactString(item, target)));
};

export async function findAssetProjectReferences(ownerId: string, publicUrl: string) {
  const projects = await prisma.project.findMany({ where: { ownerId }, select: { id: true, name: true, website: true, publishedWebsite: true, publicationIconUrl: true } });
  return projects.filter((project) => project.publicationIconUrl === publicUrl || containsExactString(project.website, publicUrl) || containsExactString(project.publishedWebsite, publicUrl)).map(({ id, name }) => ({ id, name })).slice(0, 20);
}
