-- DropIndex
DROP INDEX "Certificate_certificateNo_key";

-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "certificateNo",
DROP COLUMN "qrCodeUrl",
ADD COLUMN     "certificateCode" TEXT NOT NULL,
ADD COLUMN     "certificateNumber" TEXT NOT NULL,
ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "instituteId" TEXT NOT NULL,
ADD COLUMN     "templateId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verificationToken" TEXT NOT NULL,
ALTER COLUMN "issueDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "feedback" TEXT;

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "backgroundImage" TEXT,
    "signatureImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateTemplate_instituteId_idx" ON "CertificateTemplate"("instituteId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_deletedAt_idx" ON "CertificateTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateCode_key" ON "Certificate"("certificateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationToken_key" ON "Certificate"("verificationToken");

-- CreateIndex
CREATE INDEX "Certificate_instituteId_idx" ON "Certificate"("instituteId");

-- CreateIndex
CREATE INDEX "Certificate_templateId_idx" ON "Certificate"("templateId");

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
