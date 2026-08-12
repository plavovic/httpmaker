import "server-only";

import { del, head, put } from "@vercel/blob";

export type PutAssetInput = { storageKey: string; data: Blob; contentType: string };
export interface AssetStorage {
  putAsset(input: PutAssetInput): Promise<{ storageKey: string; publicUrl: string }>;
  deleteAsset(storageKey: string): Promise<void>;
  inspectAsset(storageKey: string): Promise<{ storageKey: string; publicUrl: string; contentType: string; size: number; bytes: Uint8Array }>;
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
    async inspectAsset(storageKey) {
      const metadata = await head(storageKey, { token });
      if (metadata.pathname !== storageKey) throw new Error("Uploaded object identity did not match the authorization.");
      const response = await fetch(metadata.url, { headers: { Range: "bytes=0-15" }, cache: "no-store", signal: AbortSignal.timeout(5_000) });
      if (!response.ok || (!response.body && response.status !== 206)) throw new Error("Uploaded object could not be inspected.");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > 16) throw new Error("Uploaded object inspection exceeded its bound.");
      return { storageKey: metadata.pathname, publicUrl: metadata.url, contentType: metadata.contentType, size: metadata.size, bytes };
    },
  };
}

export const getAssetStorage = () => createVercelBlobStorage();
