import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { startAttemptSchema } from "@/lib/validations/quizAttempt";

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

    const validationResult = startAttemptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { quizId } = validationResult.data;

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
        { message: "Forbidden: Only students can start quiz attempts" },
        { status: 403 }
      );
    }

    // Fetch quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          select: {
            id: true,
            instituteId: true,
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

    // Verify quiz is published
    if (!quiz.isPublished) {
      return NextResponse.json(
        { message: "Forbidden: This quiz is not published" },
        { status: 403 }
      );
    }

    // Tenant Isolation Check
    if (quiz.instituteId !== user.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Tenant mismatch" },
        { status: 403 }
      );
    }

    // Verify Enrollment in course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        batch: {
          courseId: quiz.courseId,
          deletedAt: null,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Forbidden: You are not enrolled in the course associated with this quiz" },
        { status: 403 }
      );
    }

    // Prevent duplicate active attempts
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        studentId: user.id,
        quizId: quiz.id,
        status: "IN_PROGRESS",
      },
    });

    if (activeAttempt) {
      return NextResponse.json(
        {
          message: "You already have an active attempt for this quiz",
          attemptId: activeAttempt.id,
        },
        { status: 400 }
      );
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: user.id,
        startedAt: new Date(),
        status: "IN_PROGRESS",
        score: 0.0,
        percentage: 0.0,
        passed: false,
      },
    });

    return NextResponse.json(
      {
        attemptId: attempt.id,
        quiz: {
          title: quiz.title,
          totalMarks: quiz.totalMarks,
          timeLimit: quiz.timeLimit,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("START QUIZ ATTEMPT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to start quiz attempt" },
      { status: 500 }
    );
  }
}
