import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { updateAnnouncementSchema } from "@/lib/validations/announcement";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id, deletedAt: null },
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
    });

    if (!announcement) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && announcement.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    // Student & Faculty audience check
    if (user.role === "STUDENT" || user.role === "FACULTY") {
      const now = new Date();
      // Verify active, published, and not expired
      if (!announcement.active || new Date(announcement.publishDate) > now) {
        return NextResponse.json({ message: "Announcement is not available yet" }, { status: 403 });
      }
      if (announcement.expiryDate && new Date(announcement.expiryDate) < now) {
        return NextResponse.json({ message: "Announcement has expired" }, { status: 403 });
      }

      if (user.role === "STUDENT") {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: user.id },
          select: {
            batchId: true,
            batch: { select: { courseId: true } }
          }
        });
        const batchIds = enrollments.map(e => e.batchId);
        const courseIds = enrollments.map(e => e.batch.courseId);

        const hasAccess =
          announcement.targetAudience === "EVERYONE" ||
          announcement.targetAudience === "STUDENTS" ||
          (announcement.targetAudience === "COURSE" && courseIds.includes(announcement.courseId || "")) ||
          (announcement.targetAudience === "BATCH" && batchIds.includes(announcement.batchId || ""));

        if (!hasAccess) {
          return NextResponse.json({ message: "Forbidden: Not in target audience" }, { status: 403 });
        }
      } else if (user.role === "FACULTY") {
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

        const hasAccess =
          announcement.targetAudience === "EVERYONE" ||
          announcement.targetAudience === "FACULTY" ||
          (announcement.targetAudience === "COURSE" && courseIds.includes(announcement.courseId || "")) ||
          (announcement.targetAudience === "BATCH" && batchIds.includes(announcement.batchId || ""));

        if (!hasAccess) {
          return NextResponse.json({ message: "Forbidden: Not in target audience" }, { status: 403 });
        }
      }
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("GET ANNOUNCEMENT ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch announcement" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id, deletedAt: null }
    });

    if (!announcement) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && announcement.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    // Faculty can only edit their own announcements
    if (user.role === "FACULTY" && announcement.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden: You did not create this announcement" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateAnnouncementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const {
      title, description, category, priority, publishDate, expiryDate,
      active, pinned, targetAudience, courseId, batchId, attachments
    } = validation.data;

    const updatedAnnouncement = await prisma.$transaction(async (tx) => {
      // If attachments are updated, mark old ones as deleted
      if (attachments !== undefined) {
        await tx.announcementAttachment.updateMany({
          where: { announcementId: params.id, deletedAt: null },
          data: { deletedAt: new Date() }
        });
      }

      const updated = await tx.announcement.update({
        where: { id: params.id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          category: category !== undefined ? category : undefined,
          priority: priority !== undefined ? priority : undefined,
          publishDate: publishDate !== undefined ? publishDate : undefined,
          expiryDate: expiryDate !== undefined ? expiryDate : undefined,
          active: active !== undefined ? active : undefined,
          pinned: pinned !== undefined ? pinned : undefined,
          targetAudience: targetAudience !== undefined ? targetAudience : undefined,
          courseId: courseId !== undefined ? (courseId || null) : undefined,
          batchId: batchId !== undefined ? (batchId || null) : undefined,
          attachments: attachments && attachments.length > 0 ? {
            create: attachments.map(att => ({
              fileUrl: att.fileUrl,
              fileName: att.fileName,
              mimeType: att.mimeType,
              fileSize: att.fileSize,
              instituteId: announcement.instituteId,
              createdBy: user.id
            }))
          } : undefined
        },
        include: {
          attachments: {
            where: { deletedAt: null }
          }
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: announcement.instituteId,
        action: "UPDATE_ANNOUNCEMENT",
        module: "ANNOUNCEMENTS",
        entityType: "Announcement",
        entityId: announcement.id,
        description: `Updated announcement: ${announcement.title}`,
        oldValues: announcement,
        newValues: updated
      });

      return updated;
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error("PATCH ANNOUNCEMENT ERROR:", error);
    return NextResponse.json({ message: "Failed to update announcement", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id, deletedAt: null }
    });

    if (!announcement) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && announcement.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden: Access denied" }, { status: 403 });
    }

    // Faculty can only delete their own announcements
    if (user.role === "FACULTY" && announcement.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden: You did not create this announcement" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete announcement
      await tx.announcement.update({
        where: { id: params.id },
        data: { deletedAt: new Date() }
      });

      // Soft delete attachments
      await tx.announcementAttachment.updateMany({
        where: { announcementId: params.id, deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: announcement.instituteId,
        action: "DELETE_ANNOUNCEMENT",
        module: "ANNOUNCEMENTS",
        entityType: "Announcement",
        entityId: announcement.id,
        description: `Soft deleted announcement: ${announcement.title}`
      });
    });

    return NextResponse.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("DELETE ANNOUNCEMENT ERROR:", error);
    return NextResponse.json({ message: "Failed to delete announcement", error: String(error) }, { status: 500 });
  }
}
