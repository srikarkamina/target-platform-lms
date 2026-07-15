-- AlterTable
ALTER TABLE "Institute" ADD COLUMN "adminName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Institute" ADD COLUMN "adminEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Institute" ADD COLUMN "adminPhone" TEXT;
ALTER TABLE "Institute" ADD COLUMN "adminId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Institute_adminId_key" ON "Institute"("adminId");

-- AddForeignKey
ALTER TABLE "Institute" ADD CONSTRAINT "Institute_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
