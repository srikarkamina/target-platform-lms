import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createDoubtSchema, getDoubtsQuerySchema } from "@/lib/validations/doubt";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = getDoubtsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { page, limit, status, priority, courseId } = validation.data;
    const search = searchParams.get("search");

    const where: any = { deletedAt: null };

    // Tenant Isolation
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins are not involved in academic doubts" }, { status: 403 });
    }
    if (!user.instituteId) {
      return NextResponse.json({ message: "Forbidden: No institute associated" }, { status: 403 });
    }
    where.instituteId = user.instituteId;

    // Role-based visibility logic
    if (user.role === "STUDENT") {
      // Students only see their own doubts
      where.createdBy = user.id;
    } else if (user.role === "FACULTY") {
      // Faculty see doubts for their taught courses
      where.course = {
        facultyId: user.id,
        deletedAt: null
      };
    } else if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Search and filters
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (courseId) where.courseId = courseId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.doubt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          course: {
            select: { id: true, title: true, courseCode: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.doubt.count({ where })
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET DOUBTS ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch doubts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only students can create doubts
    if (user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden: Only students can submit doubt tickets" }, { status: 403 });
    }

    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = createDoubtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { subject, description, courseId, priority, anonymous, attachmentUrl, attachmentName } = validation.data;

    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        batch: {
          courseId,
          deletedAt: null
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ message: "Forbidden: You are not enrolled in this course" }, { status: 403 });
    }

    // Get Course details (to identify teacher)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { facultyId: true, title: true }
    });

    const newDoubt = await prisma.$transaction(async (tx) => {
      const doubt = await tx.doubt.create({
        data: {
          subject,
          description,
          courseId,
          priority,
          anonymous: anonymous || false,
          status: "OPEN",
          attachmentUrl,
          attachmentName,
          assignedToId: course?.facultyId || null, // Auto-assign to course teacher
          instituteId,
          createdBy: user.id
        },
        include: {
          course: { select: { title: true } }
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "CREATE_DOUBT",
        module: "DOUBTS",
        entityType: "Doubt",
        entityId: doubt.id,
        description: `Submitted doubt ticket: ${subject}`
      });

      return doubt;
    });

    // Notify Course Faculty member of the new doubt ticket
    if (course?.facultyId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true }
      });
      const userName = dbUser?.name || "A Student";

      await createNotification({
        userId: course.facultyId,
        instituteId,
        title: "New Doubt Ticket Created",
        message: `${anonymous ? "A Student" : userName} created a doubt in: "${course.title}"`,
        type: NotificationType.DOUBT_ASSIGNED,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/doubts?id=${newDoubt.id}`
      }).catch(err => console.error("DOUBT CREATED NOTIFICATION ERROR:", err));
    }

    return NextResponse.json(newDoubt, { status: 201 });
  } catch (error) {
    console.error("POST DOUBT ERROR:", error);
    return NextResponse.json({ message: "Failed to submit doubt ticket", error: String(error) }, { status: 500 });
  }
}
