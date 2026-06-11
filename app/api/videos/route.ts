/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos (global listing)
 *     responses:
 *       200:
 *         description: List of all videos across all courses
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
