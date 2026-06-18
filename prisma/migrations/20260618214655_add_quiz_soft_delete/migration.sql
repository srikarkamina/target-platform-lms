-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Quiz_deletedAt_idx" ON "Quiz"("deletedAt");
