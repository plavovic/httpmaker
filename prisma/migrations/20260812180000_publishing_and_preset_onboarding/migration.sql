ALTER TABLE "Project"
  ADD COLUMN "publishedRevision" INTEGER,
  ADD COLUMN "initialPresetId" TEXT,
  ADD COLUMN "editorSetupCompletedAt" TIMESTAMP(3);

-- Existing drafts are preserved and grandfathered. New rows intentionally remain incomplete.
UPDATE "Project"
SET "editorSetupCompletedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP),
    "initialPresetId" = CASE
      WHEN "website"->>'presetId' IN ('artistic', 'analytical', 'modern', 'professional', 'colourful', 'monochrome')
      THEN "website"->>'presetId'
      ELSE NULL
    END,
    "publishedRevision" = CASE WHEN "publishedWebsite" IS NOT NULL THEN "draftRevision" ELSE NULL END;
