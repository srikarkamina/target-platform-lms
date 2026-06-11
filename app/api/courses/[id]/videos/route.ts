/**
 * @swagger
 * /api/courses/{id}/videos:
 *   get:
 *     summary: Get all videos for a course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of videos for the course
 *   post:
 *     summary: Create a new video for a course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Video created
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const videos = await prisma.video.findMany({
      where: {
        courseId: id,
        deletedAt: null,
      },
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

    const body = await req.json();

    const { title, description, videoUrl, duration, sortOrder } = body;

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        duration: duration ? Number(duration) : null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        courseId: id,
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
