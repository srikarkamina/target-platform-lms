/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get details of a specific video
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Tenant mismatch)
 *       404:
 *         description: Video not found
 *   put:
 *     summary: Update a video's metadata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               storagePath:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               mimeType:
 *                 type: string
 *               duration:
 *                 type: integer
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Video updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Video not found
 *   delete:
 *     summary: Soft delete a video and remove its file from Supabase Storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Video not found
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/supabase";
import { updateVideoSchema } from "@/lib/validations/video";
import { authorizeVideoAccess } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const auth = await authorizeVideoAccess(req, id, ["ADMIN", "SUPER_ADMIN", "FACULTY", "STUDENT"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    return NextResponse.json(auth.video);
  } catch (error) {
    console.error("GET VIDEO DETAIL ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const auth = await authorizeVideoAccess(req, id, ["ADMIN", "SUPER_ADMIN", "FACULTY"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const body = await req.json();

    // Validate body
    const validationResult = updateVideoSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const oldVideo = auth.video;

    // Update video
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: validationResult.data,
    });

    await logAction({
      req,
      userId: auth.user?.id || null,
      instituteId: auth.user?.instituteId || "global",
      action: "UPDATE",
      module: "VIDEOS",
      entityType: "Video",
      entityId: id,
      description: `Video updated: ${updatedVideo.title}`,
      oldValues: oldVideo,
      newValues: updatedVideo,
      status: "SUCCESS",
    });

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error("PUT VIDEO ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await authorizeVideoAccess(req, id, ["ADMIN", "SUPER_ADMIN", "FACULTY"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const video = auth.video!;
    const oldVideo = JSON.parse(JSON.stringify(video));

    // Soft delete database record
    await prisma.video.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    try {
      await SubscriptionService.takeUsageSnapshot(auth.user?.instituteId || "global");
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on video delete:", snapshotErr);
    }

    await logAction({
      req,
      userId: auth.user?.id || null,
      instituteId: auth.user?.instituteId || "global",
      action: "DELETE",
      module: "VIDEOS",
      entityType: "Video",
      entityId: id,
      description: `Video deleted: ${video.title}`,
      oldValues: oldVideo,
      status: "SUCCESS",
    });

    // If there is an associated Supabase Storage file, clean it up
    if (video.storagePath) {
      try {
        const bucketName = process.env.SUPABASE_VIDEO_BUCKET || "course-videos";
        await deleteFile(bucketName, video.storagePath);
      } catch (storageErr) {
        console.error("Failed to delete video file from Supabase storage:", storageErr);
      }
    }

    return NextResponse.json({ message: "Video successfully deleted" });
  } catch (error) {
    console.error("DELETE VIDEO ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete video" },
      { status: 500 }
    );
  }
}
