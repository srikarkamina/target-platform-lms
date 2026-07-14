import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAssignmentSchema } from "@/lib/validations/assignment";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { notifyAssignmentDue } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: {
        id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("GET ASSIGNMENT BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignment" },
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

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = updateAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignmentExists = await prisma.assignment.findUnique({
      where: {
        id,
      },
      include: {
        course: { select: { instituteId: true } },
      },
    });

    if (!assignmentExists || assignmentExists.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    const updatedAssignment = await prisma.assignment.update({
      where: {
        id,
      },
      data: validation.data,
    });

    const payload = await authenticateRequest(req);
    const user = payload ? await getAuthorizedUser(payload) : null;
    await logAction({
      req,
      userId: user?.id || null,
      instituteId: assignmentExists.course.instituteId,
      action: "UPDATE",
      module: "ASSIGNMENTS",
      entityType: "Assignment",
      entityId: id,
      description: `Assignment updated: ${updatedAssignment.title}`,
      oldValues: assignmentExists,
      newValues: updatedAssignment,
      status: "SUCCESS",
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("PUT ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if assignment exists
    const assignmentExists = await prisma.assignment.findUnique({
      where: {
        id,
      },
      include: {
        course: { select: { instituteId: true } },
      },
    });

    if (!assignmentExists || assignmentExists.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    const oldValues = JSON.parse(JSON.stringify(assignmentExists));

    await prisma.assignment.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const payload = await authenticateRequest(request);
    const user = payload ? await getAuthorizedUser(payload) : null;
    await logAction({
      req: request,
      userId: user?.id || null,
      instituteId: assignmentExists.course.instituteId,
      action: "DELETE",
      module: "ASSIGNMENTS",
      entityType: "Assignment",
      entityId: id,
      description: `Assignment deleted: ${assignmentExists.title}`,
      oldValues: oldValues,
      status: "SUCCESS",
    });

    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("DELETE ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || !["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Management access required" }, { status: 403 });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: {
          select: {
            instituteId: true,
            facultyId: true,
            title: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    // Role check and tenant boundary validation
    if (user.role === "FACULTY" && assignment.course.facultyId !== user.id) {
      return NextResponse.json({ message: "Forbidden: Access denied to course content" }, { status: 403 });
    }

    if (user.role !== "SUPER_ADMIN" && assignment.course.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden: Tenant mismatch" }, { status: 403 });
    }

    // 1. Get all students enrolled in the course batch(es)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        batch: {
          courseId: assignment.courseId,
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

    const enrolledStudentIds = enrollments.map((e) => e.studentId);

    // 2. Get students who have already submitted
    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: id,
      },
      select: {
        studentId: true,
      },
    });

    const submittedStudentIds = submissions.map((s) => s.studentId);

    // 3. Filter out students who already submitted
    const targetStudentIds = enrolledStudentIds.filter(
      (sid) => !submittedStudentIds.includes(sid)
    );

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ message: "All enrolled students have already submitted this assignment", count: 0 });
    }

    // 4. Send the due reminders
    let notifiedCount = 0;
    try {
      await notifyAssignmentDue({
        userIds: targetStudentIds,
        instituteId: assignment.course.instituteId,
        title: "Assignment Due Reminder",
        message: `Reminder: The assignment "${assignment.title}" for "${assignment.course.title}" is due soon. Please submit your work.`,
        actionUrl: `/dashboard/assignments/${id}`,
      });
      notifiedCount = targetStudentIds.length;
    } catch (notificationError) {
      console.error("[NOTIFICATION FAILURE] Failed to send assignment due reminders:", notificationError);
      return NextResponse.json({ message: "Failed to send reminders" }, { status: 500 });
    }

    return NextResponse.json({ message: `Due reminders sent successfully to ${notifiedCount} students`, count: notifiedCount });
  } catch (error) {
    console.error("POST ASSIGNMENT REMINDER ERROR:", error);
    return NextResponse.json({ message: "Failed to send assignment due reminders" }, { status: 500 });
  }
}
