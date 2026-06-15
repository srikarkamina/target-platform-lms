-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watchTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProgress_studentId_idx" ON "VideoProgress"("studentId");

-- CreateIndex
CREATE INDEX "VideoProgress_videoId_idx" ON "VideoProgress"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_studentId_videoId_key" ON "VideoProgress"("studentId", "videoId");

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
