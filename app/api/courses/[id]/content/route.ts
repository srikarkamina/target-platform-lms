import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCourseAccess } from "@/lib/authorization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authorize course access for GET (allowed: SUPER_ADMIN, ADMIN, FACULTY, STUDENT)
    const auth = await authorizeCourseAccess(req, id, ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { user, course } = auth;
    let progressEntries: any[] = [];

    if (user) {
      // Fetch user progress entries
      progressEntries = await prisma.progress.findMany({
        where: {
          userId: user.id,
          video: { courseId: id },
        },
      });
    }

    // 2. Fetch videos and materials in parallel (students see only published videos)
    const videoWhere: any = { courseId: id, deletedAt: null };
    if (user?.role === "STUDENT") {
      videoWhere.published = true;
    }

    const [videos, materials] = await Promise.all([
      prisma.video.findMany({
        where: videoWhere,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.material.findMany({
        where: { courseId: id, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // Map progress entries directly to their corresponding video object
    const videosWithProgress = videos.map((video) => {
      const progressEntry = progressEntries.find((p) => p.videoId === video.id);
      return {
        ...video,
        progress: progressEntry
          ? {
              completed: progressEntry.completed,
              watchTime: 0,
            }
          : null,
      };
    });

    // 3. Calculate dynamic progress stats
    const totalVideos = videos.length;
    const completedVideos = progressEntries.filter((p) => p.completed && videos.some(v => v.id === p.videoId)).length;
    const completionPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return NextResponse.json(
      {
        course,
        videos: videosWithProgress,
        materials,
        progress: {
          totalVideos,
          completedVideos,
          completionPercentage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET COURSE CONTENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch course content" },
      { status: 500 }
    );
  }
}
