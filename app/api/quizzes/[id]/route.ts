/**
 * @swagger
 * /api/quizzes/{id}:
 *   get:
 *     summary: Retrieve a specific quiz by ID
 *     description: Fetch detailed information for a single quiz, including its questions and parent course details. Blocks STUDENT role and enforces tenant isolation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the quiz to retrieve
 *     responses:
 *       200:
 *         description: Detailed quiz payload
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - role blocked or tenant mismatch
 *       404:
 *         description: Not Found - quiz not found or soft-deleted
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update quiz details and its question set
 *     description: Allows updating quiz attributes, editing existing questions, adding new ones, and deleting removed ones in a single transaction.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the quiz to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               timeLimit:
 *                 type: integer
 *               passingMarks:
 *                 type: integer
 *               totalMarks:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Question UUID (leave empty for new questions)
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correctAnswers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     questionType:
 *                       type: string
 *                       enum: [SINGLE_CHOICE, MULTIPLE_CHOICE]
 *                     marks:
 *                       type: integer
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       400:
 *         description: Bad Request - validation error
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - role blocked or tenant mismatch
 *       404:
 *         description: Not Found - quiz not found or soft-deleted
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Soft-delete a quiz
 *     description: Marks a quiz as deleted by setting its deletedAt timestamp.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the quiz to soft-delete
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - role blocked or tenant mismatch
 *       404:
 *         description: Not Found - quiz not found or soft-deleted
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { updateQuizSchema } from "@/lib/validations/quiz";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Role-based block (STUDENT is not allowed to access management backend APIs)
    if (!["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to access quizzes" },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            facultyId: true,
          },
        },
      },
    });

    if (!quiz || quiz.deletedAt) {
      return NextResponse.json(
        { message: "Quiz not found" },
        { status: 404 }
      );
    }

    // Tenant Isolation Check
    if (user.role !== "SUPER_ADMIN") {
      if (quiz.instituteId !== user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: Tenant mismatch" },
          { status: 403 }
        );
      }

      // Faculty check (only teach own courses)
      if (user.role === "FACULTY" && quiz.course.facultyId !== user.id) {
        return NextResponse.json(
          { message: "Forbidden: You are not assigned to teach the course of this quiz" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("GET QUIZ BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Role-based block (STUDENT is not allowed to access management backend APIs)
    if (!["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to access quizzes" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationResult = updateQuizSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Fetch existing quiz to verify tenant ownership
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            facultyId: true,
          },
        },
      },
    });

    if (!existingQuiz || existingQuiz.deletedAt) {
      return NextResponse.json(
        { message: "Quiz not found" },
        { status: 404 }
      );
    }

    // Tenant Isolation Check
    if (user.role !== "SUPER_ADMIN") {
      if (existingQuiz.instituteId !== user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: Tenant mismatch" },
          { status: 403 }
        );
      }

      // Faculty check
      if (user.role === "FACULTY" && existingQuiz.course.facultyId !== user.id) {
        return NextResponse.json(
          { message: "Forbidden: You are not assigned to teach the course of this quiz" },
          { status: 403 }
        );
      }
    }

    // Semantic business validation: passingMarks <= totalMarks
    const mergedPassingMarks = validationResult.data.passingMarks !== undefined
      ? validationResult.data.passingMarks
      : existingQuiz.passingMarks;

    const mergedTotalMarks = validationResult.data.totalMarks !== undefined
      ? validationResult.data.totalMarks
      : existingQuiz.totalMarks;

    if (mergedPassingMarks > mergedTotalMarks) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: [
            {
              path: ["passingMarks"],
              message: "Passing marks cannot exceed total marks",
            },
          ],
        },
        { status: 400 }
      );
    }

    const { questions, ...quizDetails } = validationResult.data;

    let updatedQuiz;

    if (questions) {
      // Fetch current questions of this quiz to resolve delta
      const existingQuestions = await prisma.question.findMany({
        where: { quizId: id },
      });

      const existingQuestionIds = existingQuestions.map((q) => q.id);
      const incomingQuestionIds = questions
        .map((q) => q.id)
        .filter((qid): qid is string => !!qid);

      // Questions to delete
      const questionIdsToDelete = existingQuestionIds.filter(
        (qid) => !incomingQuestionIds.includes(qid)
      );

      // Questions to create (no id provided or not in existing DB)
      const questionsToCreate = questions.filter((q) => !q.id);

      // Questions to update (has id and exists in DB)
      const questionsToUpdate = questions.filter(
        (q) => q.id && existingQuestionIds.includes(q.id)
      );

      updatedQuiz = await prisma.$transaction(async (tx) => {
        // 1. Delete questions that are no longer present
        if (questionIdsToDelete.length > 0) {
          await tx.question.deleteMany({
            where: { id: { in: questionIdsToDelete } },
          });
        }

        // 2. Update existing questions
        for (const q of questionsToUpdate) {
          await tx.question.update({
            where: { id: q.id },
            data: {
              question: q.question,
              options: q.options,
              correctAnswers: q.correctAnswers,
              questionType: q.questionType,
              marks: q.marks,
              order: q.order,
            },
          });
        }

        // 3. Create new questions
        for (const q of questionsToCreate) {
          await tx.question.create({
            data: {
              quizId: id,
              question: q.question,
              options: q.options,
              correctAnswers: q.correctAnswers,
              questionType: q.questionType,
              marks: q.marks,
              order: q.order,
            },
          });
        }

        // 4. Update the quiz details
        return await tx.quiz.update({
          where: { id },
          data: quizDetails,
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        });
      });
    } else {
      updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: quizDetails,
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });
    }

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("PUT QUIZ ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Role-based block (STUDENT is not allowed to access management backend APIs)
    if (!["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to access quizzes" },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            facultyId: true,
          },
        },
      },
    });

    if (!quiz || quiz.deletedAt) {
      return NextResponse.json(
        { message: "Quiz not found" },
        { status: 404 }
      );
    }

    // Tenant Isolation Check
    if (user.role !== "SUPER_ADMIN") {
      if (quiz.instituteId !== user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: Tenant mismatch" },
          { status: 403 }
        );
      }

      // Faculty check
      if (user.role === "FACULTY" && quiz.course.facultyId !== user.id) {
        return NextResponse.json(
          { message: "Forbidden: You are not assigned to teach the course of this quiz" },
          { status: 403 }
        );
      }
    }

    // Soft delete
    await prisma.quiz.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("DELETE QUIZ ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
