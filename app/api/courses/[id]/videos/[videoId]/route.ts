/**
 * @swagger
 * /api/courses/{id}/videos/{videoId}:
 *   get:
 *     summary: Get a specific video
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 *   put:
 *     summary: Update a video
 *     responses:
 *       200:
 *         description: Video updated
 *   delete:
 *     summary: Soft delete a video
 *     responses:
 *       200:
 *         description: Video deleted
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;

    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
        deletedAt: null,
      },
    });

    if (!video) {
      return NextResponse.json(
        { message: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;

    const body = await req.json();

    const { title, description, videoUrl, duration, sortOrder } = body;

    const video = await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        title,
        description,
        videoUrl,
        duration: duration !== undefined ? Number(duration) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Video deleted" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to delete video" },
      { status: 500 }
    );
  }
}
