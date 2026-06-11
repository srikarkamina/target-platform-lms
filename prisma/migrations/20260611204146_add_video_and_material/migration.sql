-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLSX', 'OTHER');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL DEFAULT 'PDF',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_courseId_idx" ON "Video"("courseId");

-- CreateIndex
CREATE INDEX "Video_deletedAt_idx" ON "Video"("deletedAt");

-- CreateIndex
CREATE INDEX "Material_courseId_idx" ON "Material"("courseId");

-- CreateIndex
CREATE INDEX "Material_deletedAt_idx" ON "Material"("deletedAt");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
