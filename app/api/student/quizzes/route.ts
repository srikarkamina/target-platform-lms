import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

/**
 * @swagger
 * /api/student/quizzes:
 *   get:
 *     summary: Retrieve quizzes assigned to the authenticated student
 *     description: Fetches published quizzes for all courses the student is enrolled in, mapping active or completed attempt statuses. Enforces tenant isolation.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of assigned quizzes with student attempt statuses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a student role or tenant mismatch
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate
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

    // Role check
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Only students can access student quizzes" },
        { status: 403 }
      );
    }

    // Ensure student has institute ID
    if (!user.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: User has no institute association" },
        { status: 403 }
      );
    }

    // Fetch enrollments to determine course access
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
        batch: {
          deletedAt: null,
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

    // Fetch quizzes for enrolled courses
    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        isPublished: true,
        deletedAt: null,
        instituteId: user.instituteId, // Tenant isolation check
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
        attempts: {
          where: {
            studentId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map attempt statuses
    const mappedQuizzes = quizzes.map((quiz) => {
      const activeAttempt = quiz.attempts.find((a) => a.status === "IN_PROGRESS");
      const completedAttempt = quiz.attempts.find((a) => a.status === "SUBMITTED");

      let status = "NOT_STARTED";
      let attemptId = null;
      let score = null;
      let percentage = null;
      let passed = null;

      if (activeAttempt) {
        status = "IN_PROGRESS";
        attemptId = activeAttempt.id;
      } else if (completedAttempt) {
        status = "COMPLETED";
        attemptId = completedAttempt.id;
        score = completedAttempt.score;
        percentage = completedAttempt.percentage;
        passed = completedAttempt.passed;
      }

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingMarks: quiz.passingMarks,
        totalMarks: quiz.totalMarks,
        course: quiz.course,
        questionCount: quiz.questions.length,
        status,
        attemptId,
        score,
        percentage,
        passed,
      };
    });

    return NextResponse.json(mappedQuizzes, { status: 200 });
  } catch (error) {
    console.error("GET STUDENT QUIZZES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch student quizzes" },
      { status: 500 }
    );
  }
}
