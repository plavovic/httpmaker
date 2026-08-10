import "server-only";

import { del, put } from "@vercel/blob";

export type PutAssetInput = { storageKey: string; data: Blob; contentType: string };
export interface AssetStorage {
  putAsset(input: PutAssetInput): Promise<{ storageKey: string; publicUrl: string }>;
  deleteAsset(storageKey: string): Promise<void>;
}

export class AssetStorageConfigurationError extends Error {}

export function createVercelBlobStorage(): AssetStorage {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new AssetStorageConfigurationError("Server asset storage is not configured.");
  return {
    async putAsset({ storageKey, data, contentType }) {
      const result = await put(storageKey, data, { access: "public", contentType, addRandomSuffix: false, token });
      return { storageKey: result.pathname, publicUrl: result.url };
    },
    async deleteAsset(storageKey) { await del(storageKey, { token }); },
  };
}

export const getAssetStorage = () => createVercelBlobStorage();
