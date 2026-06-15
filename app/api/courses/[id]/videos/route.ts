/**
 * @swagger
 * /api/courses/{id}/videos:
 *   get:
 *     summary: Get all videos for a course
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
 *         description: List of videos for the course
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Tenant mismatch)
 *       500:
 *         description: Failed to fetch videos
 *   post:
 *     summary: Create a new video for a course
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
 *             required:
 *               - title
 *               - videoUrl
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
 *       201:
 *         description: Video created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to create video
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVideoSchema } from "@/lib/validations/video";
import { authorizeCourseAccess } from "@/lib/authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await authorizeCourseAccess(request, id, ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const where: any = {
      courseId: id,
      deletedAt: null,
    };

    if (auth.user?.role === "STUDENT") {
      where.published = true;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await authorizeCourseAccess(req, id, ["ADMIN", "SUPER_ADMIN", "FACULTY"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const body = await req.json();

    // Map courseId into body for validation
    const payload = { ...body, courseId: id };

    const validationResult = createVideoSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      videoUrl,
      storagePath,
      fileName,
      fileSize,
      mimeType,
      duration,
      sortOrder,
    } = validationResult.data;

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        storagePath,
        fileName,
        fileSize,
        mimeType,
        duration: duration ? Number(duration) : null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        courseId: id,
        published: true, // Default to published on creation
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create video" },
      { status: 500 }
    );
  }
}
