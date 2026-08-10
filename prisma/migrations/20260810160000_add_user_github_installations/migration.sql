ALTER TABLE "Project"
ADD COLUMN "githubInstallationId" TEXT,
ADD COLUMN "githubRepositoryId" TEXT,
ADD COLUMN "githubRepositoryFullName" TEXT,
ADD COLUMN "githubDefaultBranch" TEXT;

CREATE TABLE "GitHubInstallation" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "installationId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "accountLogin" TEXT NOT NULL,
  "accountType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GitHubInstallation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GitHubConnectionNonce" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "nonceHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GitHubConnectionNonce_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GitHubWebhookDelivery" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GitHubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GitHubInstallation_installationId_key" ON "GitHubInstallation"("installationId");
CREATE UNIQUE INDEX "GitHubInstallation_id_ownerId_key" ON "GitHubInstallation"("id", "ownerId");
CREATE INDEX "GitHubInstallation_ownerId_idx" ON "GitHubInstallation"("ownerId");
CREATE INDEX "GitHubInstallation_ownerId_status_idx" ON "GitHubInstallation"("ownerId", "status");
CREATE UNIQUE INDEX "GitHubConnectionNonce_nonceHash_key" ON "GitHubConnectionNonce"("nonceHash");
CREATE INDEX "GitHubConnectionNonce_ownerId_expiresAt_idx" ON "GitHubConnectionNonce"("ownerId", "expiresAt");
CREATE UNIQUE INDEX "GitHubWebhookDelivery_deliveryId_key" ON "GitHubWebhookDelivery"("deliveryId");
CREATE INDEX "Project_githubInstallationId_idx" ON "Project"("githubInstallationId");

ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GitHubConnectionNonce" ADD CONSTRAINT "GitHubConnectionNonce_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_githubInstallationId_ownerId_fkey" FOREIGN KEY ("githubInstallationId", "ownerId") REFERENCES "GitHubInstallation"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing repositoryUrl values are intentionally retained but are not linked to
-- an installation. Owners must explicitly relink them through the verified flow.
