import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { createSubmissionSchema } from "@/lib/validations/submission";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentId = searchParams.get("studentId");

    const where: any = {};

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    const isManagement =
      payload.role === "ADMIN" ||
      payload.role === "SUPER_ADMIN" ||
      payload.role === "FACULTY";

    if (isManagement) {
      if (studentId) {
        where.studentId = studentId;
      }
    } else {
      where.studentId = payload.id;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET SUBMISSIONS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[SUBMISSIONS ROUTE] Received POST request to create submission.");
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.warn("[SUBMISSIONS ROUTE] Bad Request: Invalid JSON body.", err);
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }
    console.log("[SUBMISSIONS ROUTE] Request body:", JSON.stringify(body, null, 2));

    const validation = createSubmissionSchema.safeParse(body);
    if (!validation.success) {
      console.warn("[SUBMISSIONS ROUTE] Validation failed:", JSON.stringify(validation.error.issues, null, 2));
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }
    console.log("[SUBMISSIONS ROUTE] Zod validation passed.");

    const { assignmentId, fileUrl, fileName, mimeType, fileSize } = validation.data;

    // Resolve studentId from JWT token first, then fall back to body.studentId
    const payload = await authenticateRequest(req);
    const studentId = payload?.id || body.studentId;

    if (!studentId) {
      console.warn("[SUBMISSIONS ROUTE] Bad Request: Student ID could not be resolved from token or body.");
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }
    console.log(`[SUBMISSIONS ROUTE] Resolving student: studentId="${studentId}" (token matches: ${payload?.id === studentId})`);

    // Verify assignment exists and is not soft-deleted
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        deletedAt: null,
      },
    });

    if (!assignment) {
      console.warn(`[SUBMISSIONS ROUTE] Assignment not found or soft-deleted: id="${assignmentId}"`);
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }
    console.log(`[SUBMISSIONS ROUTE] Verified assignment exists: "${assignment.title}"`);

    // Create the submission
    console.log("[SUBMISSIONS ROUTE] Creating Prisma Submission record...");
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        fileUrl,
        fileName,
        mimeType,
        fileSize,
      },
    });
    console.log(`[SUBMISSIONS ROUTE] Submission record created successfully in DB: id="${submission.id}"`);

    const dbStudent = await prisma.user.findUnique({
      where: { id: studentId },
      select: { instituteId: true }
    });

    await logAction({
      req,
      userId: studentId,
      instituteId: dbStudent?.instituteId || "global",
      action: "SUBMIT",
      module: "ASSIGNMENTS",
      entityType: "Submission",
      entityId: submission.id,
      description: `Assignment submitted: "${assignment.title}"`,
      newValues: submission,
      status: "SUCCESS",
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      if (dbStudent?.instituteId) {
        await SubscriptionService.takeUsageSnapshot(dbStudent.instituteId);
      }
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on submission creation:", snapshotErr);
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("[SUBMISSIONS ROUTE] CRITICAL ERROR IN POST SUBMISSION:", error);
    return NextResponse.json(
      { message: "Failed to create submission" },
      { status: 500 }
    );
  }
}
