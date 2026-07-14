/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: List quizzes with pagination, search, and filters
 *     description: Retrieve a paginated list of quizzes. Student role is blocked. Faculty role is restricted to quizzes in their assigned courses. Admin/Super Admin are restricted to their institute (tenant).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of quizzes to return per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term matching quiz title (case-insensitive)
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter quizzes by course ID
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter quizzes by publication status (true/false)
 *     responses:
 *       200:
 *         description: A paginated list of quizzes
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - access denied for role or tenant mismatch
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new quiz with questions
 *     description: Creates a new quiz record along with its associated questions inside a database transaction.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - courseId
 *               - timeLimit
 *               - passingMarks
 *               - totalMarks
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 example: Midterm Exam
 *               description:
 *                 type: string
 *                 example: Midterm evaluation for CS101
 *               courseId:
 *                 type: string
 *                 example: course-uuid
 *               timeLimit:
 *                 type: integer
 *                 example: 60
 *               passingMarks:
 *                 type: integer
 *                 example: 50
 *               totalMarks:
 *                 type: integer
 *                 example: 100
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - question
 *                     - options
 *                     - correctAnswers
 *                     - questionType
 *                     - marks
 *                     - order
 *                   properties:
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
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Bad Request - validation errors
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - role blocked or tenant mismatch
 *       404:
 *         description: Not Found - course not found
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser, authorizeCourseAccess } from "@/lib/authorization";
import { createQuizSchema } from "@/lib/validations/quiz";
import { Prisma } from "@/app/generated/prisma/client";
import { notifyQuizPublished } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";


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

    // Role-based block (STUDENT is not allowed to access management backend APIs)
    if (!["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to access quizzes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageVal = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;

    const limitVal = parseInt(searchParams.get("limit") || "10", 10);
    const limit = isNaN(limitVal) || limitVal < 1 ? 10 : limitVal;
    const search = searchParams.get("search");
    const courseId = searchParams.get("courseId");
    const isPublishedParam = searchParams.get("isPublished");

    const where: Prisma.QuizWhereInput = {
      deletedAt: null,
    };

    // Tenant Isolation
    if (user.role !== "SUPER_ADMIN") {
      if (!user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: User does not belong to any institute" },
          { status: 403 }
        );
      }
      where.instituteId = user.instituteId;
    }

    // Faculty filtering (only quizzes in courses they teach)
    if (user.role === "FACULTY") {
      where.course = {
        facultyId: user.id,
      };
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (isPublishedParam !== null) {
      where.isPublished = isPublishedParam === "true";
    }

    const skip = (page - 1) * limit;

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: limit,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              courseCode: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    return NextResponse.json({
      quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET QUIZZES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

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

    const validationResult = createQuizSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      courseId,
      timeLimit,
      passingMarks,
      totalMarks,
      isPublished,
      questions,
    } = validationResult.data;

    // Verify course belongs to tenant and user is authorized to manage course contents
    const auth = await authorizeCourseAccess(req, courseId, ["ADMIN", "FACULTY", "SUPER_ADMIN"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { user, course } = auth;

    // Double-check role permission
    if (!user || !["ADMIN", "FACULTY", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to create quizzes" },
        { status: 403 }
      );
    }

    // Create the quiz and questions together inside a transaction
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        courseId,
        timeLimit,
        passingMarks,
        totalMarks,
        isPublished,
        createdBy: user.id,
        instituteId: course.instituteId,
        questions: {
          create: questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswers: q.correctAnswers,
            questionType: q.questionType,
            marks: q.marks,
            order: q.order,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (quiz.isPublished) {
      try {
        const enrollments = await prisma.enrollment.findMany({
          where: {
            batch: {
              courseId: quiz.courseId,
              deletedAt: null,
            },
            student: {
              deletedAt: null,
            },
          },
          select: {
            studentId: true,
          },
        });

        const studentIds = enrollments.map((e) => e.studentId);
        if (studentIds.length > 0) {
          await notifyQuizPublished({
            userIds: studentIds,
            instituteId: quiz.instituteId,
            title: "New Quiz Published",
            message: `A new quiz "${quiz.title}" has been published for your course "${course.title}".`,
            actionUrl: `/dashboard/quizzes/${quiz.id}`,
          });
        }
      } catch (notificationError) {
        console.error("[NOTIFICATION FAILURE] Failed to notify students of quiz publication:", notificationError);
      }
    }

    await logAction({
      req,
      userId: user.id,
      instituteId: course.instituteId,
      action: "CREATE",
      module: "QUIZZES",
      entityType: "Quiz",
      entityId: quiz.id,
      description: `Quiz created: ${quiz.title} for course ${course.title}`,
      newValues: quiz,
      status: "SUCCESS",
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("CREATE QUIZ ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
