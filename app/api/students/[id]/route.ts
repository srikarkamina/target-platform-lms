import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { notifyCourseEnrolled } from "@/lib/services/notification-service";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { updateStudentSchema } from "@/lib/validations/student";
import { sendResponse, sendError } from "@/lib/api-response";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await authenticateRequest(req);
    if (!payload) {
      return sendError("Unauthorized", null, 401);
    }

    const student = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!student) {
      return sendError("Student not found", null, 404);
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return sendError("Unauthorized", null, 401);
    }

    if (user.role !== "SUPER_ADMIN" && student.instituteId !== user.instituteId) {
      return sendError("Forbidden: Access denied", null, 403);
    }

    if (user.role === "FACULTY") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: id,
          batch: {
            course: {
              facultyId: user.id,
              deletedAt: null,
            },
            deletedAt: null,
          },
        },
      });

      if (!enrollment) {
        return sendError("Forbidden: You can only view students enrolled in your courses", null, 403);
      }
    }

    return sendResponse(req, student);
  } catch (error: any) {
    return sendError("Failed to fetch student details", error, 500);
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
      return sendError("Unauthorized", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return sendError("Forbidden: Admin access required", null, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return sendError("Invalid JSON body", null, 400);
    }

    const validation = updateStudentSchema.safeParse(body);
    if (!validation.success) {
      return sendError("Validation failed", validation.error.format(), 400);
    }

    const { name, email, courseIds } = validation.data;

    // Check student exists
    const currentStudent = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!currentStudent) {
      return sendError("Student not found", null, 404);
    }

    // Tenant check
    if (user.role !== "SUPER_ADMIN" && currentStudent.instituteId !== user.instituteId) {
      return sendError("Forbidden: Tenant mismatch", null, 403);
    }

    // Validate courseIds: must select at least one course
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return sendError("Please select at least one course.", null, 400);
    }

    const targetInstituteId = currentStudent.instituteId || "global";

    // Validate courses belong to the same institute
    const validCourses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        instituteId: targetInstituteId,
        deletedAt: null,
      },
    });

    if (validCourses.length !== courseIds.length) {
      return sendError("One or more selected courses are invalid or belong to a different institute.", null, 400);
    }

    // Sync enrollments inside a transaction
    let courseIdsToEnroll: string[] = [];
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. Check duplicate student email (excluding current student)
      const duplicateEmail = await tx.user.findFirst({
        where: {
          email,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (duplicateEmail) {
        throw new Error("A student with this email address already exists.");
      }

      // 2. Fetch current enrollments
      const currentEnrollments = await tx.enrollment.findMany({
        where: { studentId: id },
        include: {
          batch: true,
        },
      });

      const currentCourseIds = currentEnrollments.map((e) => e.batch.courseId);

      // Identify courses to enroll & remove
      courseIdsToEnroll = courseIds.filter((cid) => !currentCourseIds.includes(cid));
      const courseIdsToRemove = currentCourseIds.filter((cid) => !currentCourseIds.includes(cid));

      // Create new enrollments
      for (const courseId of courseIdsToEnroll) {
        let batch = await tx.batch.findFirst({
          where: { courseId, deletedAt: null },
        });

        if (!batch) {
          const course = validCourses.find(c => c.id === courseId);
          batch = await tx.batch.create({
            data: {
              name: `${course?.courseCode || "COURSE"}-Default-Batch`,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              courseId,
            },
          });
        }

        await tx.enrollment.create({
          data: {
            studentId: id,
            batchId: batch.id,
          },
        });
      }

      // Remove old enrollments
      for (const courseId of courseIdsToRemove) {
        const enrollmentToDelete = currentEnrollments.find((e) => e.batch.courseId === courseId);
        if (enrollmentToDelete) {
          await tx.enrollment.delete({
            where: { id: enrollmentToDelete.id },
          });
        }
      }

      // 3. Update student details
      return await tx.user.update({
        where: { id },
        data: {
          name,
          email,
        },
      });
    });

    // Notify student of new course enrollments
    for (const courseId of courseIdsToEnroll) {
      try {
        const course = validCourses.find((c) => c.id === courseId);
        if (course) {
          await notifyCourseEnrolled({
            userIds: updatedStudent.id,
            instituteId: targetInstituteId,
            title: "Enrolled in Course",
            message: `You have been enrolled in the course "${course.title}".`,
            actionUrl: `/dashboard/courses/${course.id}`,
          });
        }
      } catch (notificationError) {
        console.error(`[NOTIFICATION FAILURE] Failed to notify student of enrollment in course ${courseId}:`, notificationError);
      }
    }

    return sendResponse(
      req,
      {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
      },
      "Student details and enrollments updated successfully.",
      200
    );
  } catch (error: any) {
    console.error("STUDENT PUT ERROR:", error);
    if (error.code === "P2002" || error.message?.includes("Unique constraint failed") || error.message?.includes("already exists")) {
      return sendError("A student with this email address already exists.", null, 409);
    }
    return sendError("Failed to update student", error, 500);
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
      return sendError("Unauthorized", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return sendError("Forbidden: Admin access required", null, 403);
    }

    const student = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!student) {
      return sendError("Student not found", null, 404);
    }

    if (user.role !== "SUPER_ADMIN" && student.instituteId !== user.instituteId) {
      return sendError("Forbidden: Tenant mismatch", null, 403);
    }

    const targetStudent = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    try {
      await SubscriptionService.takeUsageSnapshot(targetStudent.instituteId || "global");
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on student delete:", snapshotErr);
    }

    return sendResponse(req, { id: targetStudent.id }, "Student deleted successfully");
  } catch (error: any) {
    return sendError("Failed to delete student", error, 500);
  }
}