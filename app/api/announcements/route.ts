import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createAnnouncementSchema, getAnnouncementsQuerySchema } from "@/lib/validations/announcement";
import { logAction } from "@/lib/services/audit-service";
import { createNotifications } from "@/lib/services/notification-service";
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
    const validation = getAnnouncementsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { page, limit, search, category, priority, targetAudience, active, pinned } = validation.data;

    const where: any = { deletedAt: null };

    // Tenant Isolation
    if (user.role !== "SUPER_ADMIN") {
      if (!user.instituteId) {
        return NextResponse.json({ message: "Forbidden: No institute association" }, { status: 403 });
      }
      where.instituteId = user.instituteId;
    }

    // Role-based target audience and visibility filters
    const now = new Date();
    if (user.role === "STUDENT") {
      // Active and published only
      where.active = true;
      where.publishDate = { lte: now };
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gt: now } }
      ];

      // Fetch student courses and batches
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: {
          batchId: true,
          batch: {
            select: { courseId: true }
          }
        }
      });
      const batchIds = enrollments.map(e => e.batchId);
      const courseIds = enrollments.map(e => e.batch.courseId);

      where.AND = [
        {
          OR: [
            { targetAudience: "EVERYONE" },
            { targetAudience: "STUDENTS" },
            { AND: [{ targetAudience: "COURSE" }, { courseId: { in: courseIds } }] },
            { AND: [{ targetAudience: "BATCH" }, { batchId: { in: batchIds } }] }
          ]
        }
      ];
    } else if (user.role === "FACULTY") {
      // Active and published only
      where.active = true;
      where.publishDate = { lte: now };
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gt: now } }
      ];

      // Fetch faculty courses and batches
      const courses = await prisma.course.findMany({
        where: { facultyId: user.id, deletedAt: null },
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);

      const batches = await prisma.batch.findMany({
        where: { course: { facultyId: user.id }, deletedAt: null },
        select: { id: true }
      });
      const batchIds = batches.map(b => b.id);

      where.AND = [
        {
          OR: [
            { targetAudience: "EVERYONE" },
            { targetAudience: "FACULTY" },
            { AND: [{ targetAudience: "COURSE" }, { courseId: { in: courseIds } }] },
            { AND: [{ targetAudience: "BATCH" }, { batchId: { in: batchIds } }] }
          ]
        }
      ];
    } else {
      // Admins and Super Admins can filter by active/pinned query params
      if (active !== undefined) where.active = active;
      if (pinned !== undefined) where.pinned = pinned;
      if (targetAudience) where.targetAudience = targetAudience;
    }

    // Common search & filters
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { pinned: "desc" },
          { publishDate: "desc" }
        ],
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          course: {
            select: { id: true, title: true }
          },
          batch: {
            select: { id: true, name: true }
          },
          attachments: {
            where: { deletedAt: null }
          }
        }
      }),
      prisma.announcement.count({ where })
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET ANNOUNCEMENTS ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch announcements" }, { status: 500 });
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

    // Role verification
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Admin or Faculty access required" }, { status: 403 });
    }

    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = createAnnouncementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const {
      title, description, category, priority, publishDate, expiryDate,
      active, pinned, targetAudience, courseId, batchId, attachments
    } = validation.data;

    // Build creation data
    const newAnnouncement = await prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          instituteId,
          title,
          description,
          category,
          priority,
          publishDate: publishDate || new Date(),
          expiryDate: expiryDate || null,
          active: active !== undefined ? active : true,
          pinned: pinned !== undefined ? pinned : false,
          targetAudience,
          courseId: courseId || null,
          batchId: batchId || null,
          createdBy: user.id,
          attachments: attachments && attachments.length > 0 ? {
            create: attachments.map(att => ({
              fileUrl: att.fileUrl,
              fileName: att.fileName,
              mimeType: att.mimeType,
              fileSize: att.fileSize,
              instituteId,
              createdBy: user.id
            }))
          } : undefined
        },
        include: {
          attachments: true
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "CREATE_ANNOUNCEMENT",
        module: "ANNOUNCEMENTS",
        entityType: "Announcement",
        entityId: announcement.id,
        description: `Created announcement: ${title}`,
        newValues: announcement
      });

      return announcement;
    });

    // Send notifications to targeted users if the announcement is published and active
    const now = new Date();
    const isPublishedNow = newAnnouncement.active && new Date(newAnnouncement.publishDate) <= now;
    if (isPublishedNow) {
      // Find recipient user IDs based on targetAudience
      let recipientIds: string[] = [];

      if (targetAudience === "EVERYONE") {
        const users = await prisma.user.findMany({
          where: { instituteId, deletedAt: null },
          select: { id: true }
        });
        recipientIds = users.map(u => u.id);
      } else if (targetAudience === "STUDENTS") {
        const users = await prisma.user.findMany({
          where: { instituteId, role: "STUDENT", deletedAt: null },
          select: { id: true }
        });
        recipientIds = users.map(u => u.id);
      } else if (targetAudience === "FACULTY") {
        const users = await prisma.user.findMany({
          where: { instituteId, role: "FACULTY", deletedAt: null },
          select: { id: true }
        });
        recipientIds = users.map(u => u.id);
      } else if (targetAudience === "COURSE" && courseId) {
        // Enrolled students in the course
        const enrollments = await prisma.enrollment.findMany({
          where: {
            batch: { courseId, deletedAt: null }
          },
          select: { studentId: true }
        });
        // Also course instructor
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { facultyId: true }
        });

        const idsSet = new Set(enrollments.map(e => e.studentId));
        if (course?.facultyId) idsSet.add(course.facultyId);
        recipientIds = Array.from(idsSet);
      } else if (targetAudience === "BATCH" && batchId) {
        // Enrolled students in batch
        const enrollments = await prisma.enrollment.findMany({
          where: { batchId },
          select: { studentId: true }
        });
        // Also batch course instructor
        const batch = await prisma.batch.findUnique({
          where: { id: batchId },
          select: {
            course: { select: { facultyId: true } }
          }
        });

        const idsSet = new Set(enrollments.map(e => e.studentId));
        if (batch?.course?.facultyId) idsSet.add(batch.course.facultyId);
        recipientIds = Array.from(idsSet);
      }

      // Filter out duplicate or empty values
      recipientIds = recipientIds.filter(id => id !== user.id);

      if (recipientIds.length > 0) {
        // Translate priority to NotificationPriority
        let notifPriority: NotificationPriority = NotificationPriority.NORMAL;
        if (priority === "CRITICAL" || priority === "HIGH") {
          notifPriority = NotificationPriority.HIGH;
        } else if (priority === "LOW") {
          notifPriority = NotificationPriority.LOW;
        }

        await createNotifications({
          userIds: recipientIds,
          instituteId,
          title: `New Announcement: ${title}`,
          message: description.substring(0, 100) + (description.length > 100 ? "..." : ""),
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          priority: notifPriority,
          actionUrl: `/dashboard/announcements?id=${newAnnouncement.id}`
        });
      }
    }

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error("POST ANNOUNCEMENTS ERROR:", error);
    return NextResponse.json({ message: "Failed to create announcement", error: String(error) }, { status: 500 });
  }
}
