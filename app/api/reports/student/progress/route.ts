import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

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

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Only students can access student reports" },
        { status: 403 }
      );
    }

    // 1. Get Enrollments (Courses student is actively enrolled in)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
        batch: {
          deletedAt: null,
          course: {
            deletedAt: null,
          },
        },
      },
      include: {
        batch: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
                videos: {
                  where: {
                    deletedAt: null,
                    published: true,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.batch.courseId);

    // 2. Fetch progress entries for enrolled courses
    const progressEntries = await prisma.progress.findMany({
      where: {
        userId: user.id,
        video: {
          courseId: { in: enrolledCourseIds },
          deletedAt: null,
          published: true,
        },
      },
      select: {
        videoId: true,
        completed: true,
        updatedAt: true,
        video: {
          select: {
            courseId: true,
          },
        },
      },
    });

    // 3. Map course progress reports
    const reports = enrollments.map((enrollment) => {
      const course = enrollment.batch.course;
      const courseVideos = course.videos;
      const totalVideos = courseVideos.length;

      const courseProgress = progressEntries.filter(
        (p) => p.video.courseId === course.id
      );

      const lessonsCompleted = courseProgress.filter((p) => p.completed).length;
      const lessonsRemaining = Math.max(0, totalVideos - lessonsCompleted);
      const completionPercentage =
        totalVideos > 0 ? Math.round((lessonsCompleted / totalVideos) * 100) : 0;

      // Determine last access date by looking at the most recently updated progress record for the course
      let lastAccessDate: Date | null = null;
      if (courseProgress.length > 0) {
        const timestamps = courseProgress.map((p) => p.updatedAt.getTime());
        lastAccessDate = new Date(Math.max(...timestamps));
      }

      return {
        courseId: course.id,
        courseCode: course.courseCode,
        courseTitle: course.title,
        completionPercentage,
        lessonsCompleted,
        lessonsRemaining,
        lastAccessDate,
      };
    });

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error("GET STUDENT COURSE PROGRESS REPORT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch student course progress report" },
      { status: 500 }
    );
  }
}
