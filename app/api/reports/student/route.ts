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
              include: {
                videos: {
                  where: {
                    deletedAt: null,
                    published: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.batch.courseId);
    const totalCoursesEnrolled = enrolledCourseIds.length;

    // 2. Fetch all completed progress entries for enrolled courses to evaluate completion status in memory
    const progressEntries = await prisma.progress.findMany({
      where: {
        userId: user.id,
        completed: true,
        video: {
          courseId: { in: enrolledCourseIds },
          deletedAt: null,
          published: true,
        },
      },
      select: {
        videoId: true,
        video: {
          select: {
            courseId: true,
          },
        },
      },
    });

    let completedCourses = 0;
    let inProgressCourses = 0;

    for (const enrollment of enrollments) {
      const course = enrollment.batch.course;
      const courseVideos = course.videos;
      const totalVideos = courseVideos.length;

      if (totalVideos === 0) {
        inProgressCourses++;
        continue;
      }

      const completedCount = progressEntries.filter(
        (p) => p.video.courseId === course.id
      ).length;

      if (completedCount === totalVideos) {
        completedCourses++;
      } else {
        inProgressCourses++;
      }
    }

    // 3. Quiz statistics via SQL aggregation
    const quizStats = await prisma.quizAttempt.aggregate({
      where: {
        studentId: user.id,
        status: "SUBMITTED",
      },
      _count: {
        id: true,
      },
      _avg: {
        percentage: true,
      },
      _max: {
        percentage: true,
      },
      _min: {
        percentage: true,
      },
    });

    const totalQuizzesAttempted = quizStats._count.id || 0;
    const averageQuizScore = quizStats._avg.percentage !== null ? Math.round(quizStats._avg.percentage * 10) / 10 : 0;
    const highestQuizScore = quizStats._max.percentage !== null ? Math.round(quizStats._max.percentage * 10) / 10 : 0;
    const lowestQuizScore = quizStats._min.percentage !== null ? Math.round(quizStats._min.percentage * 10) / 10 : 0;

    // 4. Assignments statistics
    const totalAssignments = await prisma.assignment.count({
      where: {
        courseId: { in: enrolledCourseIds },
        deletedAt: null,
      },
    });

    const assignmentsSubmitted = await prisma.submission.count({
      where: {
        studentId: user.id,
        assignment: {
          courseId: { in: enrolledCourseIds },
          deletedAt: null,
        },
      },
    });

    const pendingAssignments = Math.max(0, totalAssignments - assignmentsSubmitted);

    // 5. Certificates count
    const certificatesEarned = await prisma.certificate.count({
      where: {
        studentId: user.id,
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    return NextResponse.json({
      totalCoursesEnrolled,
      completedCourses,
      inProgressCourses,
      totalQuizzesAttempted,
      averageQuizScore,
      highestQuizScore,
      lowestQuizScore,
      totalAssignments,
      assignmentsSubmitted,
      pendingAssignments,
      certificatesEarned,
    }, { status: 200 });

  } catch (error) {
    console.error("GET STUDENT SUMMARY REPORT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate student reports summary" },
      { status: 500 }
    );
  }
}
