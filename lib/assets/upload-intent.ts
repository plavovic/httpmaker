import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type UploadIntent = { ownerId: string; projectId?: string; migrationKey?: string; storageKey: string; name: string; mimeType: string; size: number; expiresAt: number };

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Asset upload authorization is not configured.");
  return value;
};
const encode = (value: string) => Buffer.from(value).toString("base64url");
const signature = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function signUploadIntent(intent: UploadIntent) {
  const payload = encode(JSON.stringify(intent));
  return `${payload}.${signature(payload)}`;
}

export function verifyUploadIntent(value: string | null | undefined): UploadIntent {
  if (!value || value.length > 2_000) throw new Error("Invalid upload authorization.");
  const [payload, supplied, extra] = value.split(".");
  if (!payload || !supplied || extra) throw new Error("Invalid upload authorization.");
  const expected = signature(payload);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid upload authorization.");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadIntent;
  if (!parsed.ownerId || !parsed.storageKey || parsed.expiresAt < Date.now()) throw new Error("Upload authorization expired.");
  return parsed;
}
