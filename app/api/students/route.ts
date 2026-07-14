import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import bcrypt from "bcryptjs";
import { notifyCourseEnrolled } from "@/lib/services/notification-service";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { createStudentSchema } from "@/lib/validations/student";
import { sendResponse, sendError } from "@/lib/api-response";


export async function GET(req: NextRequest) {
  try {
    const where: any = {
      role: "STUDENT",
      deletedAt: null,
    };

    // Tenant Isolation
    const payload = await authenticateRequest(req);
    if (payload) {
      const user = await getAuthorizedUser(payload);
      if (user && user.role !== "SUPER_ADMIN") {
        where.instituteId = user.instituteId;
      }
      if (user && user.role === "FACULTY") {
        where.enrollments = {
          some: {
            batch: {
              course: {
                facultyId: user.id,
                deletedAt: null
              }
            }
          }
        };
      }
    }

    const students = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return sendResponse(req, students);
  } catch (error) {
    console.error("STUDENT GET ERROR:", error);
    return sendError("Failed to fetch students", error, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return sendError("Unauthorized: Invalid or missing token", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return sendError("Unauthorized: User not found in database", null, 401);
    }

    // Role check: Only ADMIN and SUPER_ADMIN can create students
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return sendError("Forbidden: Administrator access required", null, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return sendError("Invalid JSON body", null, 400);
    }

    const validation = createStudentSchema.safeParse(body);
    if (!validation.success) {
      return sendError("Validation failed", validation.error.format(), 400);
    }

    const { name, email, courseIds } = validation.data;

    // Resolve tenant ID
    const targetInstituteId = user.role === "SUPER_ADMIN" ? (body.instituteId || user.instituteId) : user.instituteId;
    if (!targetInstituteId) {
      return sendError("Institute ID is required and could not be resolved", null, 400);
    }

    // Validate courses exist and belong to the institute
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

    // Check student capacity limit
    const canAddStudent = await SubscriptionService.checkStudentLimit(targetInstituteId);
    if (!canAddStudent) {
      return sendError("Student enrollment limit reached for this subscription plan. Please upgrade.", null, 400);
    }

    // Execute database operations inside a single Prisma transaction
    const student = await prisma.$transaction(async (tx) => {
      // 1. Check duplicate student email
      const existingUser = await tx.user.findFirst({
        where: { email, deletedAt: null },
      });
      if (existingUser) {
        throw new Error("A student with this email address already exists.");
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash("123456", 10);

      // 3. Create student
      const createdStudent = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          instituteId: targetInstituteId,
        },
      });

      // 4. Enroll in each course batch
      for (const courseId of courseIds) {
        // Find or create active batch for the course
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

        // Create enrollment record
        await tx.enrollment.create({
          data: {
            studentId: createdStudent.id,
            batchId: batch.id,
          },
        });
      }

      return createdStudent;
    });

    // Notify student of course enrollments after transaction success
    try {
      const { sendTemplateEmail } = await import("@/lib/services/email-service");
      const instituteObj = await prisma.institute.findUnique({
        where: { id: targetInstituteId },
        select: { name: true },
      });
      const instituteName = instituteObj?.name || "Target LMS";

      await sendTemplateEmail({
        recipientEmail: student.email,
        type: "WELCOME",
        variables: {
          studentName: student.name,
          name: student.name,
          instituteName,
        },
        userId: student.id,
        instituteId: targetInstituteId,
      });
    } catch (welcomeErr) {
      console.error("[WELCOME EMAIL FAILURE] Failed to send welcome email:", welcomeErr);
    }

    for (const courseId of courseIds) {
      try {
        const course = validCourses.find((c) => c.id === courseId);
        if (course) {
          await notifyCourseEnrolled({
            userIds: student.id,
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

    try {
      await SubscriptionService.takeUsageSnapshot(targetInstituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on student creation:", snapshotErr);
    }

    return sendResponse(
      req,
      {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      `Student created successfully and enrolled in ${courseIds.length} courses.`,
      201
    );
  } catch (error: any) {
    console.error("STUDENT POST ERROR:", error);
    if (error.code === "P2002" || error.message?.includes("Unique constraint failed") || error.message?.includes("already exists")) {
      return sendError("A student with this email already exists.", null, 409);
    }
    return sendError("Failed to create student", error, 500);
  }
}