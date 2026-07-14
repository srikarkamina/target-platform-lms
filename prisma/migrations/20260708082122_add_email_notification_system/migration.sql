-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'COURSE_ENROLLMENT', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_REMINDER', 'QUIZ_PUBLISHED', 'QUIZ_REMINDER', 'CERTIFICATE_ISSUED', 'PASSWORD_RESET', 'GENERAL');

-- AlterTable
ALTER TABLE "InstituteSettings" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smtpEncryption" TEXT DEFAULT 'NONE',
ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPassword" TEXT,
ADD COLUMN     "smtpPort" INTEGER,
ADD COLUMN     "smtpReplyTo" TEXT,
ADD COLUMN     "smtpSenderEmail" TEXT,
ADD COLUMN     "smtpSenderName" TEXT,
ADD COLUMN     "smtpUsername" TEXT;

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailHistory" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "userId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplate_instituteId_idx" ON "EmailTemplate"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_instituteId_type_key" ON "EmailTemplate"("instituteId", "type");

-- CreateIndex
CREATE INDEX "EmailHistory_instituteId_idx" ON "EmailHistory"("instituteId");

-- CreateIndex
CREATE INDEX "EmailHistory_userId_idx" ON "EmailHistory"("userId");

-- CreateIndex
CREATE INDEX "EmailHistory_status_idx" ON "EmailHistory"("status");

-- CreateIndex
CREATE INDEX "EmailHistory_createdAt_idx" ON "EmailHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailHistory" ADD CONSTRAINT "EmailHistory_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailHistory" ADD CONSTRAINT "EmailHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
