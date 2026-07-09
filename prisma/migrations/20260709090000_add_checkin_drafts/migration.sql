ALTER TABLE "CheckIn" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CheckIn_isDraft_updatedAt_idx" ON "CheckIn"("isDraft", "updatedAt");
