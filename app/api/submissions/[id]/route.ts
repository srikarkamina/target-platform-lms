import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { updateSubmissionSchema } from "@/lib/validations/submission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: {
        id,
      },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
              },
            },
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
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("GET SUBMISSION BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch submission" },
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
    console.log(`[SUBMISSION DETAILS PUT] Received PUT request for submissionId="${id}"`);

    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.warn("[SUBMISSION DETAILS PUT] Bad Request: Invalid JSON body.", err);
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }
    console.log("[SUBMISSION DETAILS PUT] Request body:", JSON.stringify(body, null, 2));

    const validation = updateSubmissionSchema.safeParse(body);
    if (!validation.success) {
      console.warn("[SUBMISSION DETAILS PUT] Validation failed:", JSON.stringify(validation.error.issues, null, 2));
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }
    console.log("[SUBMISSION DETAILS PUT] Zod validation passed.");

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      console.warn(`[SUBMISSION DETAILS PUT] Submission not found: id="${id}"`);
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }
    console.log(`[SUBMISSION DETAILS PUT] Found existing submission: studentId="${submission.studentId}", current grade=${submission.grade}`);

    // Authenticate requesting user
    const payload = await authenticateRequest(req);
    if (!payload) {
      console.warn("[SUBMISSION DETAILS PUT] Unauthorized: Missing or invalid token");
      return NextResponse.json(
        { message: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }
    console.log(`[SUBMISSION DETAILS PUT] Authenticated user: email="${payload.email}", role="${payload.role}", id="${payload.id}"`);

    const isManagement =
      payload.role === "ADMIN" ||
      payload.role === "SUPER_ADMIN" ||
      payload.role === "FACULTY";

    const dataToUpdate: any = {};

    if (isManagement) {
      console.log("[SUBMISSION DETAILS PUT] Performing update as instructor/management role.");
      // Instructors can grade the submission or adjust properties
      if (validation.data.grade !== undefined) {
        dataToUpdate.grade = validation.data.grade;
      }
      if (validation.data.fileUrl !== undefined) {
        dataToUpdate.fileUrl = validation.data.fileUrl;
        dataToUpdate.fileName = validation.data.fileName;
        dataToUpdate.mimeType = validation.data.mimeType;
        dataToUpdate.fileSize = validation.data.fileSize;
      }
    } else {
      console.log("[SUBMISSION DETAILS PUT] Performing update as student role.");
      // Student self-update check
      if (submission.studentId !== payload.id) {
        console.warn(`[SUBMISSION DETAILS PUT] Forbidden: Student "${payload.id}" tried to update submission owned by student "${submission.studentId}"`);
        return NextResponse.json(
          { message: "Forbidden: You cannot modify this submission" },
          { status: 403 }
        );
      }

      // Check if already graded
      if (submission.grade !== null) {
        console.warn("[SUBMISSION DETAILS PUT] Bad Request: Student tried to edit a graded submission.");
        return NextResponse.json(
          { message: "Cannot edit submission after it has been graded" },
          { status: 400 }
        );
      }

      // Ensure students do not try to input a grade
      if (validation.data.grade !== undefined) {
        console.warn("[SUBMISSION DETAILS PUT] Forbidden: Student tried to assign/update grade.");
        return NextResponse.json(
          { message: "Forbidden: Students are not allowed to update grades" },
          { status: 403 }
        );
      }

      if (validation.data.fileUrl !== undefined) {
        dataToUpdate.fileUrl = validation.data.fileUrl;
        dataToUpdate.fileName = validation.data.fileName;
        dataToUpdate.mimeType = validation.data.mimeType;
        dataToUpdate.fileSize = validation.data.fileSize;
      }
    }

    console.log("[SUBMISSION DETAILS PUT] Updating record with data:", JSON.stringify(dataToUpdate, null, 2));

    const updatedSubmission = await prisma.submission.update({
      where: {
        id,
      },
      data: dataToUpdate,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log("[SUBMISSION DETAILS PUT] Submission successfully updated.");

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("[SUBMISSION DETAILS PUT] CRITICAL ERROR IN PUT SUBMISSION BY ID:", error);
    return NextResponse.json(
      { message: "Failed to update submission" },
      { status: 500 }
    );
  }
}
