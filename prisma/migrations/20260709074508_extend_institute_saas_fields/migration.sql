/*
  Warnings:

  - The `status` column on the `Institute` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "InstituteStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED');

-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedBy" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "InstituteStatus" NOT NULL DEFAULT 'ACTIVE';
