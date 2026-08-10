export type AssetStoragePort = { putAsset(input: { storageKey: string; data: Blob; contentType: string }): Promise<{ storageKey: string; publicUrl: string }>; deleteAsset(storageKey: string): Promise<void> };

export async function uploadAssetWithRollback<T>(input: { ownerId: string; projectId?: string; file: Blob; name: string; mimeType: string; size: number }, dependencies: { storage: AssetStoragePort; createRecord(data: { ownerId: string; projectId?: string; storageKey: string; publicUrl: string; name: string; mimeType: string; size: number }): Promise<T>; key?: () => string }) {
  const uploaded = await dependencies.storage.putAsset({ storageKey: `assets/${dependencies.key?.() ?? crypto.randomUUID()}`, data: input.file, contentType: input.mimeType });
  try { return await dependencies.createRecord({ ownerId: input.ownerId, ...(input.projectId ? { projectId: input.projectId } : {}), ...uploaded, name: input.name, mimeType: input.mimeType, size: input.size }); }
  catch (error) { try { await dependencies.storage.deleteAsset(uploaded.storageKey); } catch { /* preserve the original database error */ } throw error; }
}
