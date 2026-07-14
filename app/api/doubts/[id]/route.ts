import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { updateDoubtSchema } from "@/lib/validations/doubt";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

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

    const doubt = await prisma.doubt.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        course: {
          select: { id: true, title: true, facultyId: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          include: {
            creator: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    if (!doubt) {
      return NextResponse.json({ message: "Doubt ticket not found" }, { status: 404 });
    }

    // Block SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins are not involved in academic doubts" }, { status: 403 });
    }

    // Tenant isolation
    if (doubt.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Role-based authorization: Student can only view their own; Faculty only their taught courses
    if (user.role === "STUDENT" && doubt.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden: You are not the author of this doubt" }, { status: 403 });
    }

    if (user.role === "FACULTY" && doubt.course.facultyId !== user.id) {
      return NextResponse.json({ message: "Forbidden: You do not teach the course for this doubt" }, { status: 403 });
    }

    // If anonymous, remove student name for faculty/other students (but keep for admins)
    if (doubt.anonymous && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && doubt.createdBy !== user.id) {
      doubt.creator.name = "Anonymous Student";
      doubt.creator.email = "";
    }

    return NextResponse.json(doubt);
  } catch (error) {
    console.error("GET DOUBT DETAIL ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch doubt ticket" }, { status: 500 });
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

    const doubt = await prisma.doubt.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        course: { select: { facultyId: true, title: true } }
      }
    });

    if (!doubt) {
      return NextResponse.json({ message: "Doubt ticket not found" }, { status: 404 });
    }

    // Block SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins are not involved in academic doubts" }, { status: 403 });
    }

    // Tenant isolation
    if (doubt.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Role permissions check: Faculty only for their assigned course; Admins all
    const isCourseFaculty = user.role === "FACULTY" && doubt.course.facultyId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isCourseFaculty && !isAdmin) {
      return NextResponse.json({ message: "Forbidden: You are not authorized to manage this doubt ticket" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateDoubtSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { status, assignedToId } = validation.data;

    if (user.role === "FACULTY" && assignedToId !== undefined) {
      return NextResponse.json({ message: "Forbidden: Faculty cannot change the doubt assignee" }, { status: 403 });
    }

    const oldStatus = doubt.status;
    const oldAssignee = doubt.assignedToId;

    const updatedDoubt = await prisma.$transaction(async (tx) => {
      const result = await tx.doubt.update({
        where: { id: params.id },
        data: {
          status: status !== undefined ? status : undefined,
          assignedToId: assignedToId !== undefined ? (assignedToId || null) : undefined
        },
        include: {
          assignedTo: { select: { name: true } }
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: doubt.instituteId,
        action: "UPDATE_DOUBT",
        module: "DOUBTS",
        entityType: "Doubt",
        entityId: doubt.id,
        description: `Updated doubt status to ${status || oldStatus} and assignee to ${result.assignedTo?.name || "Unassigned"}`,
        oldValues: { status: oldStatus, assignedToId: oldAssignee },
        newValues: { status: result.status, assignedToId: result.assignedToId }
      });

      return result;
    });

    // Notify Student of Status updates
    if (status && status !== oldStatus) {
      let title = "Doubt Ticket Updated";
      let msg = `Your doubt ticket status was changed to ${status}.`;
      let priority: NotificationPriority = NotificationPriority.NORMAL;

      if (status === "RESOLVED") {
        title = "Doubt Ticket Resolved";
        msg = `Your doubt: "${doubt.subject}" has been marked as RESOLVED by the instructor.`;
        priority = NotificationPriority.HIGH;
      } else if (status === "CLOSED") {
        title = "Doubt Ticket Closed";
        msg = `Your doubt: "${doubt.subject}" has been closed.`;
      }

      await createNotification({
        userId: doubt.createdBy,
        instituteId: doubt.instituteId,
        title,
        message: msg,
        type: NotificationType.DOUBT_RESOLVED,
        priority,
        actionUrl: `/dashboard/doubts?id=${doubt.id}`
      }).catch(err => console.error("DOUBT STATUS NOTIFICATION ERROR:", err));
    }

    // Notify Assignee of Reassignment
    if (assignedToId && assignedToId !== oldAssignee) {
      await createNotification({
        userId: assignedToId,
        instituteId: doubt.instituteId,
        title: "Doubt Ticket Assigned",
        message: `You have been assigned to resolve a doubt: "${doubt.subject}"`,
        type: NotificationType.DOUBT_ASSIGNED,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/doubts?id=${doubt.id}`
      }).catch(err => console.error("DOUBT ASSIGNEE NOTIFICATION ERROR:", err));
    }

    return NextResponse.json(updatedDoubt);
  } catch (error) {
    console.error("PATCH DOUBT DETAIL ERROR:", error);
    return NextResponse.json({ message: "Failed to update doubt ticket" }, { status: 500 });
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

    const doubt = await prisma.doubt.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        course: { select: { facultyId: true } }
      }
    });

    if (!doubt) {
      return NextResponse.json({ message: "Doubt ticket not found" }, { status: 404 });
    }

    // Block SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins are not involved in academic doubts" }, { status: 403 });
    }

    // Tenant isolation
    if (doubt.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Only owner or admin can soft delete doubt ticket
    const isOwner = doubt.createdBy === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden: You are not permitted to delete this doubt ticket" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.doubt.update({
        where: { id: params.id },
        data: { deletedAt: new Date() }
      });

      // Soft delete replies
      await tx.doubtReply.updateMany({
        where: { doubtId: params.id, deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: doubt.instituteId,
        action: "DELETE_DOUBT",
        module: "DOUBTS",
        entityType: "Doubt",
        entityId: doubt.id,
        description: `Soft deleted doubt ticket: ${doubt.subject}`
      });
    });

    return NextResponse.json({ message: "Doubt ticket deleted successfully" });
  } catch (error) {
    console.error("DELETE DOUBT DETAIL ERROR:", error);
    return NextResponse.json({ message: "Failed to delete doubt ticket" }, { status: 500 });
  }
}
