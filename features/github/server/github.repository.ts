import "server-only";
import { prisma } from "@/lib/prisma";

export const listGitHubInstallations = (ownerId: string) => prisma.gitHubInstallation.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, select: { id: true, accountId: true, accountLogin: true, accountType: true, status: true, createdAt: true, updatedAt: true } });
export const findOwnedGitHubInstallation = (id: string, ownerId: string) => prisma.gitHubInstallation.findFirst({ where: { id, ownerId } });
export const findGitHubInstallationByExternalId = (installationId: string) => prisma.gitHubInstallation.findUnique({ where: { installationId } });
export const upsertGitHubInstallation = (data: { ownerId: string; installationId: string; accountId: string; accountLogin: string; accountType: string }) => prisma.gitHubInstallation.upsert({ where: { installationId: data.installationId }, create: data, update: { accountId: data.accountId, accountLogin: data.accountLogin, accountType: data.accountType, status: "active" } });
export const disconnectGitHubInstallation = (id: string, ownerId: string) => prisma.$transaction(async (tx) => { const installation = await tx.gitHubInstallation.findFirst({ where: { id, ownerId } }); if (!installation) return false; await tx.project.updateMany({ where: { ownerId, githubInstallationId: id }, data: { githubInstallationId: null, githubRepositoryId: null, githubRepositoryFullName: null, githubDefaultBranch: null, repositoryUrl: null } }); await tx.gitHubInstallation.delete({ where: { id } }); return true; });
export const createGitHubNonce = (ownerId: string, nonceHash: string, expiresAt: Date) => prisma.gitHubConnectionNonce.create({ data: { ownerId, nonceHash, expiresAt } });
export const consumeGitHubNonce = (ownerId: string, nonceHash: string) => prisma.gitHubConnectionNonce.updateMany({ where: { ownerId, nonceHash, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
export const recordWebhookDelivery = (deliveryId: string, event: string) => prisma.gitHubWebhookDelivery.create({ data: { deliveryId, event } });
export const updateInstallationStatus = (installationId: string, status: string) => prisma.gitHubInstallation.updateMany({ where: { installationId }, data: { status } });

export const processGitHubWebhookDelivery = (input: { deliveryId: string; event: string; installationId?: string; status?: string }) =>
  prisma.$transaction(async (tx) => {
    await tx.gitHubWebhookDelivery.create({ data: { deliveryId: input.deliveryId, event: input.event } });
    if (input.installationId && input.status) {
      await tx.gitHubInstallation.updateMany({ where: { installationId: input.installationId }, data: { status: input.status } });
    }
  });
