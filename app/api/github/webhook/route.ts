import { Prisma } from "@prisma/client";
import { processGitHubWebhookDelivery } from "@/features/github/server/github.repository";
import { verifyGitHubWebhookSignature } from "@/lib/github/webhook";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > 1_000_000) return Response.json({ error: "Webhook body is too large." }, { status: 413 });
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 1_000_000) return Response.json({ error: "Webhook body is too large." }, { status: 413 });
  if (!verifyGitHubWebhookSignature(body, request.headers.get("x-hub-signature-256") ?? "", secret)) return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  const deliveryId = request.headers.get("x-github-delivery")?.slice(0, 100);
  const event = request.headers.get("x-github-event")?.slice(0, 100);
  if (!deliveryId || !event) return Response.json({ error: "Missing webhook metadata." }, { status: 400 });
  let payload: { action?: string; installation?: { id?: number } };
  try { payload = JSON.parse(body); } catch { return Response.json({ error: "Invalid webhook JSON." }, { status: 400 }); }
  try {
    const status = event === "installation" ? payload.action === "deleted" ? "deleted" : payload.action === "suspend" ? "suspended" : payload.action === "unsuspend" || payload.action === "created" || payload.action === "new_permissions_accepted" ? "active" : undefined : undefined;
    await processGitHubWebhookDelivery({ deliveryId, event, ...(status && payload.installation?.id ? { installationId: String(payload.installation.id), status } : {}) });
    return Response.json({ ok: true });
  } catch (error) {
    if ((error instanceof Prisma.PrismaClientKnownRequestError || (typeof error === "object" && error !== null && "code" in error)) && (error as { code?: string }).code === "P2002") return Response.json({ ok: true, duplicate: true });
    console.error("GitHub webhook processing failed.");
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
