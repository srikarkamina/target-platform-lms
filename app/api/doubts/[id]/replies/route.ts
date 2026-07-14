import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createDoubtReplySchema } from "@/lib/validations/doubt";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Authorization: User must be creator of the doubt, or course teacher, or admin
    const isOwner = doubt.createdBy === user.id;
    const isCourseFaculty = user.role === "FACULTY" && doubt.course.facultyId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isCourseFaculty && !isAdmin) {
      return NextResponse.json({ message: "Forbidden: Not permitted to reply to this doubt" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createDoubtReplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { content } = validation.data;

    const newReply = await prisma.$transaction(async (tx) => {
      const reply = await tx.doubtReply.create({
        data: {
          doubtId: params.id,
          content,
          instituteId: doubt.instituteId,
          createdBy: user.id
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: doubt.instituteId,
        action: "CREATE_DOUBT_REPLY",
        module: "DOUBTS",
        entityType: "DoubtReply",
        entityId: reply.id,
        description: `Replied to doubt ticket: ${doubt.subject}`
      });

      return reply;
    });

    // Fetch user name from database for notification messages
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    });
    const userName = dbUser?.name || "A User";

    // Notifications
    if (user.role === "STUDENT") {
      // Notify the assignee (if assigned) or course instructor (if not assigned)
      const recipientId = doubt.assignedToId || doubt.course.facultyId;
      if (recipientId) {
        await createNotification({
          userId: recipientId,
          instituteId: doubt.instituteId,
          title: "New reply on Doubt ticket",
          message: `${doubt.anonymous ? "Anonymous Student" : userName} replied: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
          type: NotificationType.DOUBT_ASSIGNED,
          priority: NotificationPriority.NORMAL,
          actionUrl: `/dashboard/doubts?id=${doubt.id}`
        }).catch(err => console.error("DOUBT REPLY NOTIFICATION FOR FACULTY ERROR:", err));
      }
    } else {
      // Faculty/Admin replied -> Notify the student creator
      await createNotification({
        userId: doubt.createdBy,
        instituteId: doubt.instituteId,
        title: "Instructor replied to your doubt",
        message: `${userName} replied: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        type: NotificationType.DOUBT_RESOLVED,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/doubts?id=${doubt.id}`
      }).catch(err => console.error("DOUBT REPLY NOTIFICATION FOR STUDENT ERROR:", err));
    }

    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error("POST DOUBT REPLY ERROR:", error);
    return NextResponse.json({ message: "Failed to create reply", error: String(error) }, { status: 500 });
  }
}
