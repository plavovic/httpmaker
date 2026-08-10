import "server-only";

import { prisma } from "@/lib/prisma";

export const listAssetsByOwner = (ownerId: string, projectId?: string) => prisma.asset.findMany({
  where: { ownerId, ...(projectId ? { projectId } : {}) },
  orderBy: { createdAt: "desc" },
  select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true },
});

export const createAssetRecord = (data: { ownerId: string; projectId?: string; storageKey: string; publicUrl: string; name: string; mimeType: string; size: number; width?: number; height?: number }) => prisma.asset.create({ data, select: { id: true, projectId: true, publicUrl: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true } });
export const findAssetByIdAndOwner = (id: string, ownerId: string) => prisma.asset.findFirst({ where: { id, ownerId } });
export const deleteAssetRecord = (id: string, ownerId: string) => prisma.asset.deleteMany({ where: { id, ownerId } });
export const listProjectAssetStorageKeys = (projectId: string, ownerId: string) => prisma.asset.findMany({ where: { projectId, ownerId }, select: { storageKey: true } });
