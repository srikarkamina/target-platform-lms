/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos (filtered by institute and optionally course)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter videos by course ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search videos by title
 *     responses:
 *       200:
 *         description: List of videos
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new video record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - videoUrl
 *               - courseId
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
 *               courseId:
 *                 type: string
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
 *         description: Server error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { createVideoSchema } from "@/lib/validations/video";
import { Prisma } from "@/app/generated/prisma/client";
import { getAuthorizedUser, authorizeCourseAccess } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: User not found in database" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const search = searchParams.get("search");

    const where: Prisma.VideoWhereInput = {
      deletedAt: null,
    };

    // Tenant Isolation and Role-based filtering
    if (user.role === "STUDENT") {
      where.published = true;
      where.course = {
        instituteId: user.instituteId || undefined,
        batches: {
          some: {
            enrollments: {
              some: {
                studentId: user.id,
              },
            },
          },
        },
      };
    } else if (user.role === "FACULTY") {
      where.course = {
        instituteId: user.instituteId || undefined,
        facultyId: user.id,
      };
    } else if (user.role !== "SUPER_ADMIN") {
      where.course = {
        instituteId: user.instituteId || undefined,
      };
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("GET GLOBAL VIDEOS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Incoming video payload:", body);

    // Validate body using Zod schema
    const validationResult = createVideoSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.issues);
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
      courseId,
    } = validationResult.data;

    // Verify course belongs to tenant and user is authorized to manage course contents
    const auth = await authorizeCourseAccess(req, courseId, ["ADMIN", "SUPER_ADMIN", "FACULTY"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        storagePath,
        fileName,
        fileSize,
        mimeType,
        duration,
        sortOrder,
        courseId,
        published: true, // Default to published on creation
      },
    });

    await logAction({
      req,
      userId: auth.user?.id || null,
      instituteId: auth.user?.instituteId || "global",
      action: "UPLOAD",
      module: "VIDEOS",
      entityType: "Video",
      entityId: video.id,
      description: `Video uploaded: ${video.title} for course ${auth.course?.courseCode || ""}`,
      newValues: video,
      status: "SUCCESS",
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("CREATE VIDEO ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create video" },
      { status: 500 }
    );
  }
}
