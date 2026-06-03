-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "facultyId" TEXT;

-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");

-- CreateIndex
CREATE INDEX "Assignment_deletedAt_idx" ON "Assignment"("deletedAt");

-- CreateIndex
CREATE INDEX "Batch_courseId_idx" ON "Batch"("courseId");

-- CreateIndex
CREATE INDEX "Batch_deletedAt_idx" ON "Batch"("deletedAt");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

-- CreateIndex
CREATE INDEX "Certificate_deletedAt_idx" ON "Certificate"("deletedAt");

-- CreateIndex
CREATE INDEX "Course_facultyId_idx" ON "Course"("facultyId");

-- CreateIndex
CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");

-- CreateIndex
CREATE INDEX "Institute_deletedAt_idx" ON "Institute"("deletedAt");

-- CreateIndex
CREATE INDEX "Payment_instituteId_idx" ON "Payment"("instituteId");

-- CreateIndex
CREATE INDEX "Payment_deletedAt_idx" ON "Payment"("deletedAt");

-- CreateIndex
CREATE INDEX "Test_courseId_idx" ON "Test"("courseId");

-- CreateIndex
CREATE INDEX "Test_deletedAt_idx" ON "Test"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
