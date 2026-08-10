import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type StatePayload = { userId: string; nonce: string; expiresAt: number };
const encode = (value: string) => Buffer.from(value).toString("base64url");
export const hashGitHubNonce = (nonce: string) => createHash("sha256").update(nonce).digest("hex");

export function signGitHubState(payload: StatePayload, secret: string) {
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}

export function verifyGitHubState(state: string, secret: string, now = Date.now()): StatePayload | null {
  const [encoded, signature, extra] = state.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StatePayload;
    if (!payload || typeof payload.userId !== "string" || typeof payload.nonce !== "string" || !Number.isFinite(payload.expiresAt) || payload.expiresAt < now) return null;
    return payload;
  } catch { return null; }
}
