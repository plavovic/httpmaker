export type AssetStoragePort = { putAsset(input: { storageKey: string; data: Blob; contentType: string }): Promise<{ storageKey: string; publicUrl: string }>; deleteAsset(storageKey: string): Promise<void> };

export async function uploadAssetWithRollback<T>(input: { ownerId: string; projectId?: string; migrationKey?: string; file: Blob; name: string; mimeType: string; size: number }, dependencies: { storage: AssetStoragePort; createRecord(data: { ownerId: string; projectId?: string; migrationKey?: string; storageKey: string; publicUrl: string; name: string; mimeType: string; size: number }): Promise<T>; key?: () => string }) {
  const uploaded = await dependencies.storage.putAsset({ storageKey: `assets/${dependencies.key?.() ?? crypto.randomUUID()}`, data: input.file, contentType: input.mimeType });
  try { return await dependencies.createRecord({ ownerId: input.ownerId, ...(input.projectId ? { projectId: input.projectId } : {}), ...(input.migrationKey ? { migrationKey: input.migrationKey } : {}), ...uploaded, name: input.name, mimeType: input.mimeType, size: input.size }); }
  catch (error) { try { await dependencies.storage.deleteAsset(uploaded.storageKey); } catch { /* preserve the original database error */ } throw error; }
}

export async function runIdempotentAssetMigration<T>(identity: { ownerId: string; projectId: string; migrationKey: string }, dependencies: { findExisting(): Promise<T | null>; upload(): Promise<T> }) {
  const existing = await dependencies.findExisting();
  if (existing) return { asset: existing, reused: true };
  return { asset: await dependencies.upload(), reused: false };
}
