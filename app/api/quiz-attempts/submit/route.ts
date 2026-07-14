import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { submitAttemptSchema } from "@/lib/validations/quizAttempt";
import { logAction } from "@/lib/services/audit-service";

/**
 * @swagger
 * /api/quiz-attempts/submit:
 *   post:
 *     summary: Submit a quiz attempt and calculate score
 *     description: Finalizes the quiz attempt. Evaluates all questions, sums up marks for correct answers, calculates percentage, checks if passing marks are met, updates status to SUBMITTED, and records the score.
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
 *             properties:
 *               attemptId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the quiz attempt to submit
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attemptId:
 *                   type: string
 *                 score:
 *                   type: number
 *                 percentage:
 *                   type: number
 *                 passed:
 *                   type: boolean
 *                 status:
 *                   type: string
 *       400:
 *         description: Bad request or validation failure
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - student doesn't own this attempt, tenant mismatch, or not student role
 *       404:
 *         description: Attempt not found
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

    const validationResult = submitAttemptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { attemptId } = validationResult.data;

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
        { message: "Forbidden: Only students can submit attempts" },
        { status: 403 }
      );
    }

    // Fetch attempt with its quiz questions and current answers
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
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
        { message: "Forbidden: Quiz attempt has already been submitted" },
        { status: 400 }
      );
    }

    // Calculate score
    let totalScore = 0;
    const questions = attempt.quiz.questions;
    const answers = attempt.answers;

    const answerMap = new Map(answers.map((ans) => [ans.questionId, ans]));

    for (const question of questions) {
      const studentAnswer = answerMap.get(question.id);
      if (studentAnswer && studentAnswer.isCorrect) {
        totalScore += question.marks;
      }
    }

    const totalMarks = attempt.quiz.totalMarks || 1;
    const percentage = (totalScore / totalMarks) * 100;
    const passed = totalScore >= attempt.quiz.passingMarks;

    // Update QuizAttempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        score: totalScore,
        percentage,
        passed,
      },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "SUBMIT",
      module: "QUIZZES",
      entityType: "QuizAttempt",
      entityId: updatedAttempt.id,
      description: `Quiz attempt submitted: "${attempt.quiz.title}" (Score: ${totalScore}/${totalMarks})`,
      newValues: updatedAttempt,
      status: "SUCCESS",
    });

    return NextResponse.json(
      {
        message: "Quiz attempt submitted successfully",
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        percentage: updatedAttempt.percentage,
        passed: updatedAttempt.passed,
        status: updatedAttempt.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SUBMIT ATTEMPT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to submit quiz attempt" },
      { status: 500 }
    );
  }
}
