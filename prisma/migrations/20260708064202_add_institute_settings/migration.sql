-- CreateTable
CREATE TABLE "InstituteSettings" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "defaultSignatureImage" TEXT,
    "defaultSealImage" TEXT,
    "defaultCertificateTemplateId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstituteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstituteSettings_instituteId_key" ON "InstituteSettings"("instituteId");

-- CreateIndex
CREATE INDEX "InstituteSettings_instituteId_idx" ON "InstituteSettings"("instituteId");

-- AddForeignKey
ALTER TABLE "InstituteSettings" ADD CONSTRAINT "InstituteSettings_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituteSettings" ADD CONSTRAINT "InstituteSettings_defaultCertificateTemplateId_fkey" FOREIGN KEY ("defaultCertificateTemplateId") REFERENCES "CertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
