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
      select: {
        batch: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.batch.courseId);

    // 2. Fetch Quizzes for Enrolled Courses along with Student's Attempts
    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        deletedAt: null,
        isPublished: true,
      },
      include: {
        course: {
          select: {
            courseCode: true,
          },
        },
        attempts: {
          where: {
            studentId: user.id,
            status: "SUBMITTED",
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Map Quizzes to Analytics
    const reports = quizzes.map((quiz) => {
      const attempts = quiz.attempts;
      const attemptCount = attempts.length;

      const latestAttempt = attempts[0] || null;
      const latestScore = latestAttempt ? Math.round(latestAttempt.percentage * 10) / 10 : null;
      const highestScore =
        attemptCount > 0
          ? Math.round(Math.max(...attempts.map((a) => a.percentage)) * 10) / 10
          : null;
      const averageScore =
        attemptCount > 0
          ? Math.round(
              (attempts.reduce((sum, a) => sum + a.percentage, 0) / attemptCount) *
                10
            ) / 10
          : null;

      let passFailStatus = "N/A";
      if (latestAttempt) {
        passFailStatus = latestAttempt.passed ? "Pass" : "Fail";
      }

      return {
        quizId: quiz.id,
        quizName: quiz.title,
        courseCode: quiz.course.courseCode,
        attemptCount,
        latestScore,
        highestScore,
        averageScore,
        passFailStatus,
      };
    });

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error("GET STUDENT QUIZ ANALYTICS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch student quiz analytics" },
      { status: 500 }
    );
  }
}
