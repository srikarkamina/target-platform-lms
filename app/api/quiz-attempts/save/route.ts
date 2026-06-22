import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { saveAnswerSchema } from "@/lib/validations/quizAttempt";

/**
 * @swagger
 * /api/quiz-attempts/save:
 *   post:
 *     summary: Save or update student answer for a specific question
 *     description: Validates the request, checks that the attempt is owned by the student and is in progress, matches the answers without partial credit, and upserts a QuizAnswer record.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attemptId
 *               - questionId
 *               - selectedAnswers
 *             properties:
 *               attemptId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the quiz attempt
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the question
 *               selectedAnswers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Student's selected answer choice(s)
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *       400:
 *         description: Bad request or validation failure
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student doesn't own this attempt, tenant mismatch, or not student role
 *       404:
 *         description: Attempt or question not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationResult = saveAnswerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { attemptId, questionId, selectedAnswers } = validationResult.data;

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

    // STUDENT role only
    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Only students can save answers" },
        { status: 403 }
      );
    }

    // Fetch attempt with quiz to verify tenant
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            id: true,
            instituteId: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { message: "Quiz attempt not found" },
        { status: 404 }
      );
    }

    // Enforce ownership
    if (attempt.studentId !== user.id) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this quiz attempt" },
        { status: 403 }
      );
    }

    // Enforce tenant isolation
    if (attempt.quiz.instituteId !== user.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Tenant mismatch" },
        { status: 403 }
      );
    }

    // Verify attempt is IN_PROGRESS
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { message: "Forbidden: Cannot save answers to a submitted attempt" },
        { status: 400 }
      );
    }

    // Fetch Question to verify it belongs to this quiz
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    if (question.quizId !== attempt.quizId) {
      return NextResponse.json(
        { message: "Forbidden: Question does not belong to the quiz for this attempt" },
        { status: 400 }
      );
    }

    // Evaluate isCorrect
    const correctAnswersVal = question.correctAnswers;
    if (!Array.isArray(correctAnswersVal)) {
      return NextResponse.json(
        { message: "Server error: Invalid question schema in database" },
        { status: 500 }
      );
    }

    const correctAnswersArray = correctAnswersVal as string[];
    const correctSet = new Set(correctAnswersArray);
    const selectedSet = new Set(selectedAnswers);
    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every((ans) => selectedSet.has(ans));

    // Find if there is an existing answer and update or create
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: {
        attemptId,
        questionId,
      },
    });

    let answer;
    if (existingAnswer) {
      answer = await prisma.quizAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedAnswers,
          isCorrect,
        },
      });
    } else {
      answer = await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedAnswers,
          isCorrect,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Answer saved successfully",
        answerId: answer.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SAVE ANSWER ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save answer" },
      { status: 500 }
    );
  }
}
