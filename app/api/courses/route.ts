/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     responses:
 *       200:
 *         description: List of courses
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { createCourseSchema } from "@/lib/validations/course";
import { sendResponse, sendError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const where: any = { deletedAt: null };

    // Tenant Isolation
    const payload = await authenticateRequest(req);
    if (payload) {
      const user = await getAuthorizedUser(payload);
      if (user && user.role !== "SUPER_ADMIN") {
        where.instituteId = user.instituteId;
      }
      if (user && user.role === "FACULTY") {
        where.facultyId = user.id;
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        institute: true,
        faculty: true,
      },
    });

    return sendResponse(req, courses);
  } catch (error) {
    console.error(error);
    return sendError("Failed to fetch courses", error, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return sendError("Invalid JSON body", null, 400);
    }

    const validation = createCourseSchema.safeParse(body);
    if (!validation.success) {
      return sendError("Validation failed", validation.error.format(), 400);
    }

    const {
      title,
      description,
      courseCode,
      instituteId: bodyInstituteId,
      facultyId,
    } = validation.data;

    // 1. Try to get instituteId from authenticated user
    let resolvedInstituteId = null;
    const payload = await authenticateRequest(req);
    console.log("[POST /api/courses] Authenticated payload:", payload);
    if (!payload) {
      return sendError("Unauthorized", null, 401);
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return sendError("Forbidden: Only administrators can create courses", null, 403);
    }
    resolvedInstituteId = user.instituteId;
    console.log("[POST /api/courses] User instituteId:", resolvedInstituteId);

    // 2. Fallback to first institute in db
    if (!resolvedInstituteId) {
      const firstInst = await prisma.institute.findFirst();
      resolvedInstituteId = firstInst?.id;
      console.log("[POST /api/courses] Fallback to first institute in DB:", resolvedInstituteId);
    }

    // 3. Fallback to body
    if (!resolvedInstituteId) {
      resolvedInstituteId = bodyInstituteId;
    }

    if (!resolvedInstituteId) {
      console.error("[POST /api/courses] Error: No instituteId could be resolved.");
      return sendError("Institute ID is required and could not be resolved", null, 400);
    }

    // Verify course capacity limit
    const canAddCourse = await SubscriptionService.checkCourseLimit(resolvedInstituteId);
    if (!canAddCourse) {
      return sendError("Course catalog limit reached for this subscription plan. Please upgrade.", null, 400);
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        courseCode,
        instituteId: resolvedInstituteId,
        facultyId,
      },
    });

    console.log("[POST /api/courses] Course created successfully:", course);

    await logAction({
      req,
      userId: payload?.id || null,
      instituteId: resolvedInstituteId,
      action: "CREATE",
      module: "COURSES",
      entityType: "Course",
      entityId: course.id,
      description: `Course created: ${course.courseCode} - ${course.title}`,
      newValues: course,
      status: "SUCCESS",
    });

    try {
      await SubscriptionService.takeUsageSnapshot(resolvedInstituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on course creation:", snapshotErr);
    }

    return sendResponse(req, course, "Course created successfully", 201);
  } catch (error: any) {
    console.error("[POST /api/courses] Exception caught:");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.error("Full Error Object:", error);

    return sendError("Failed to create course", error, 500);
  }
}