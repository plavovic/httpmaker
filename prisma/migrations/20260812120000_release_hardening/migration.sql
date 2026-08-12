ALTER TABLE "Project"
  ADD COLUMN "draftRevision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deletionState" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "deletionError" TEXT;

ALTER TABLE "Asset"
  ADD COLUMN "migrationKey" TEXT,
  ADD COLUMN "deletionState" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "deletionError" TEXT;

CREATE UNIQUE INDEX "Project_id_ownerId_key" ON "Project"("id", "ownerId");
CREATE UNIQUE INDEX "Asset_ownerId_projectId_migrationKey_key" ON "Asset"("ownerId", "projectId", "migrationKey");

ALTER TABLE "Asset" DROP CONSTRAINT "Asset_projectId_fkey";
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_ownerId_fkey"
  FOREIGN KEY ("projectId", "ownerId") REFERENCES "Project"("id", "ownerId")
  ON DELETE CASCADE ON UPDATE CASCADE;
