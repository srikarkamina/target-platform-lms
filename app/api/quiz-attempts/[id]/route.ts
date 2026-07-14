import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

/**
 * @swagger
 * /api/quiz-attempts/{id}:
 *   get:
 *     summary: Get details of a specific quiz attempt
 *     description: Retrieves details of a quiz attempt, including associated questions and saved answers. Enforces tenant isolation. For students, ownership is verified, and correct answers are hidden if the attempt is still in progress.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the quiz attempt to retrieve
 *     responses:
 *       200:
 *         description: Quiz attempt details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden due to ownership check or tenant mismatch
 *       404:
 *         description: Attempt not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch quiz attempt with answers and quiz
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { message: "Quiz attempt not found" },
        { status: 404 }
      );
    }

    // Role check and Tenant/Ownership isolation
    if (user.role === "STUDENT") {
      // Students must own the attempt
      if (attempt.studentId !== user.id) {
        return NextResponse.json(
          { message: "Forbidden: You do not own this quiz attempt" },
          { status: 403 }
        );
      }
    } else if (["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      // Admin/Faculty must share the same institute
      if (attempt.quiz.instituteId !== user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: Tenant mismatch" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Forbidden: Role not authorized" },
        { status: 403 }
      );
    }

    // Build the payload
    const isStudent = user.role === "STUDENT";
    const isInProgress = attempt.status === "IN_PROGRESS";

    // Clean up questions & answers if student is requesting an in-progress attempt
    const questions = attempt.quiz.questions.map((q) => {
      if (isStudent && isInProgress) {
        const qCopy = { ...q } as any;
        delete qCopy.correctAnswers;
        return qCopy;
      }
      return q;
    });

    const answers = attempt.answers.map((ans) => {
      if (isStudent && isInProgress) {
        const ansCopy = { ...ans } as any;
        delete ansCopy.isCorrect;
        return ansCopy;
      }
      return ans;
    });

    const responsePayload = {
      id: attempt.id,
      quizId: attempt.quizId,
      studentId: attempt.studentId,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      createdAt: attempt.createdAt,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        timeLimit: attempt.quiz.timeLimit,
        passingMarks: attempt.quiz.passingMarks,
        totalMarks: attempt.quiz.totalMarks,
        questions,
      },
      answers,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("GET ATTEMPT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz attempt" },
      { status: 500 }
    );
  }
}
