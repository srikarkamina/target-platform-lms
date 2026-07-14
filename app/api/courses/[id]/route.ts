import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { updateCourseSchema } from "@/lib/validations/course";
import { sendResponse, sendError } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    return sendError("Course not found", null, 404);
  }
  return sendResponse(request, course);
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
      return sendError("Invalid JSON body", null, 400);
    }

    const validation = updateCourseSchema.safeParse(body);
    if (!validation.success) {
      return sendError("Validation failed", validation.error.format(), 400);
    }

    const payload = await authenticateRequest(req);
    if (!payload) {
      return sendError("Unauthorized", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return sendError("Forbidden: Only administrators can modify courses", null, 403);
    }

    const oldCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!oldCourse) {
      return sendError("Course not found", null, 404);
    }

    if (user.role !== "SUPER_ADMIN" && oldCourse.instituteId !== user.instituteId) {
      return sendError("Forbidden: Access denied to this tenant's data", null, 403);
    }

    const instituteId = user.instituteId || "global";

    const course = await prisma.course.update({
      where: {
        id,
      },
      data: validation.data as any,
    });

    await logAction({
      req,
      userId: user?.id || null,
      instituteId,
      action: "UPDATE",
      module: "COURSES",
      entityType: "Course",
      entityId: id,
      description: `Course updated: ${course.courseCode} - ${course.title}`,
      oldValues: oldCourse,
      newValues: course,
      status: "SUCCESS",
    });

    return sendResponse(req, course, "Course updated successfully");
  } catch (error: any) {
    console.error("PUT COURSE ERROR:", error);
    return sendError("Failed to update course", error, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payload = await authenticateRequest(request);
    if (!payload) {
      return sendError("Unauthorized", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return sendError("Forbidden: Only administrators can delete courses", null, 403);
    }

    const oldCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!oldCourse) {
      return sendError("Course not found", null, 404);
    }

    if (user.role !== "SUPER_ADMIN" && oldCourse.instituteId !== user.instituteId) {
      return sendError("Forbidden: Access denied to this tenant's data", null, 403);
    }

    const instituteId = user.instituteId || "global";

    const targetCourse = await prisma.course.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    try {
      await SubscriptionService.takeUsageSnapshot(targetCourse.instituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on course delete:", snapshotErr);
    }

    await logAction({
      req: request,
      userId: user?.id || null,
      instituteId,
      action: "DELETE",
      module: "COURSES",
      entityType: "Course",
      entityId: id,
      description: `Course deleted: ${oldCourse?.courseCode || ""} - ${oldCourse?.title || ""}`,
      oldValues: oldCourse,
      status: "SUCCESS",
    });

    return sendResponse(request, { id: targetCourse.id }, "Course deleted successfully");
  } catch (error: any) {
    console.error("DELETE COURSE ERROR:", error);
    return sendError("Failed to delete course", error, 500);
  }
}