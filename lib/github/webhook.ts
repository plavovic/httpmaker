import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGitHubWebhookSignature(body: string, signature: string, secret: string) {
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
