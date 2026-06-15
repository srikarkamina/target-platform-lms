-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT;
