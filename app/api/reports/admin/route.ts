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

    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can access admin reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let instituteId = user.instituteId;

    if (user.role === "SUPER_ADMIN") {
      const queryInstituteId = searchParams.get("instituteId");
      if (queryInstituteId) {
        instituteId = queryInstituteId;
      }
    } else {
      if (!instituteId) {
        return NextResponse.json(
          { message: "Forbidden: User has no institute association" },
          { status: 403 }
        );
      }
    }

    // 1. Where filters configuration for multi-tenancy
    const courseWhere: any = { deletedAt: null };
    const enrollmentWhere: any = {
      batch: {
        deletedAt: null,
        course: {
          deletedAt: null,
        },
      },
    };

    if (instituteId) {
      courseWhere.instituteId = instituteId;
      enrollmentWhere.batch.course.instituteId = instituteId;
    }

    // 2. Fetch Courses
    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        faculty: {
          select: {
            name: true,
          },
        },
        videos: {
          where: { published: true, deletedAt: null },
          select: { id: true },
        },
        quizzes: {
          where: { deletedAt: null },
          select: { id: true },
        },
        assignments: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const courseIds = courses.map((c) => c.id);

    // 3. Fetch enrollments, video progresses, quiz attempts, and assignments submissions
    const [enrollments, progressEntries, quizAttempts, submissions] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: {
          batch: {
            select: {
              courseId: true,
            },
          },
        },
      }),
      prisma.progress.findMany({
        where: {
          completed: true,
          video: {
            courseId: { in: courseIds },
            published: true,
            deletedAt: null,
          },
        },
        select: {
          userId: true,
          videoId: true,
          video: {
            select: {
              courseId: true,
            },
          },
        },
      }),
      prisma.quizAttempt.findMany({
        where: {
          status: "SUBMITTED",
          quiz: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          percentage: true,
          quiz: {
            select: {
              courseId: true,
            },
          },
        },
      }),
      prisma.submission.findMany({
        where: {
          assignment: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          studentId: true,
          assignment: {
            select: {
              courseId: true,
            },
          },
        },
      }),
    ]);

    // 4. Compute course metrics in memory
    const courseReports = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.batch.courseId === course.id
      );
      const studentCount = courseEnrollments.length;

      let completedCount = 0;
      let totalProgressSum = 0;
      const totalVideos = course.videos.length;

      courseEnrollments.forEach((enrollment) => {
        if (totalVideos === 0) return;

        const completedVideos = progressEntries.filter(
          (p) =>
            p.userId === enrollment.studentId &&
            p.video.courseId === course.id
        ).length;

        const progressPercent = (completedVideos / totalVideos) * 100;
        totalProgressSum += progressPercent;

        if (completedVideos === totalVideos) {
          completedCount++;
        }
      });

      const completionRate =
        studentCount > 0 ? Math.round((completedCount / studentCount) * 1000) / 10 : 0;
      const averageProgress =
        studentCount > 0 ? Math.round((totalProgressSum / studentCount) * 10) / 10 : 0;

      // Quiz analytics
      const courseQuizAttempts = quizAttempts.filter(
        (qa) => qa.quiz.courseId === course.id
      );
      const quizAttemptsCount = courseQuizAttempts.length;
      const averageQuizScore =
        quizAttemptsCount > 0
          ? Math.round(
              (courseQuizAttempts.reduce((sum, qa) => sum + qa.percentage, 0) /
                quizAttemptsCount) *
                10
            ) / 10
          : 0;

      // Assignment analytics
      const courseSubmissions = submissions.filter(
        (s) => s.assignment.courseId === course.id
      );
      const totalAssignmentsCount = course.assignments.length;
      const totalPossibleSubmissions = studentCount * totalAssignmentsCount;
      const submissionRate =
        totalPossibleSubmissions > 0
          ? Math.round((courseSubmissions.length / totalPossibleSubmissions) * 1000) / 10
          : 0;

      return {
        courseId: course.id,
        courseCode: course.courseCode,
        courseTitle: course.title,
        facultyName: course.faculty?.name || "Unassigned",
        studentCount,
        completionRate,
        averageProgress,
        averageQuizScore,
        submissionRate,
        quizzesCount: course.quizzes.length,
        assignmentsCount: totalAssignmentsCount,
      };
    });

    return NextResponse.json(courseReports, { status: 200 });

  } catch (error) {
    console.error("GET ADMIN GENERAL REPORTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate admin reports analytics" },
      { status: 500 }
    );
  }
}
