import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCourseAccess } from "@/lib/authorization";
import { createDiscussionReplySchema } from "@/lib/validations/discussion";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string; discussionId: string }> }) {
  const params = await props.params;
  const { id: courseId, discussionId } = params;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const replies = await prisma.discussionReply.findMany({
      where: {
        discussionId,
        deletedAt: null
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error("GET DISCUSSION REPLIES ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch replies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string; discussionId: string }> }) {
  const params = await props.params;
  const { id: courseId, discussionId } = params;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const user = authResult.user!;
    const instituteId = user.instituteId || "global";

    const discussion = await prisma.discussion.findFirst({
      where: { id: discussionId, courseId, deletedAt: null }
    });

    if (!discussion) {
      return NextResponse.json({ message: "Discussion thread not found" }, { status: 404 });
    }

    // Check locking
    const isManager = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (discussion.locked && !isManager) {
      return NextResponse.json({ message: "Forbidden: This thread is locked and read-only" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createDiscussionReplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { content, parentId, isOfficialAnswer } = validation.data;

    // Check parent reply validity if nested
    if (parentId) {
      const parentReply = await prisma.discussionReply.findFirst({
        where: { id: parentId, discussionId, deletedAt: null }
      });
      if (!parentReply) {
        return NextResponse.json({ message: "Parent reply not found in this thread" }, { status: 404 });
      }
    }

    // Official Answer check: only Faculty or Admin
    if (isOfficialAnswer && !isManager) {
      return NextResponse.json({ message: "Forbidden: Only faculty or administrators can mark official answers" }, { status: 403 });
    }

    const newReply = await prisma.$transaction(async (tx) => {
      const reply = await tx.discussionReply.create({
        data: {
          discussionId,
          parentId: parentId || null,
          content,
          isOfficialAnswer: isOfficialAnswer || false,
          instituteId,
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
        instituteId,
        action: "CREATE_DISCUSSION_REPLY",
        module: "DISCUSSIONS",
        entityType: "DiscussionReply",
        entityId: reply.id,
        description: `Replied to thread: ${discussion.title}`
      });

      return reply;
    });

    // Fetch user name from database for notification messages
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    });
    const userName = dbUser?.name || "A User";

    // Trigger Notification for DISCUSSION_REPLY
    // 1. Notify the thread author (if not the one replying)
    if (discussion.createdBy !== user.id) {
      await createNotification({
        userId: discussion.createdBy,
        instituteId,
        title: "New reply on your discussion",
        message: `${userName} replied: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        type: NotificationType.DISCUSSION_REPLY,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/courses/${courseId}?tab=discussions&id=${discussionId}`
      }).catch(err => console.error("DISCUSSION_REPLY NOTIFICATION ERROR:", err));
    }

    // 2. Notify the parent reply author if replying to a reply
    if (parentId) {
      const parent = await prisma.discussionReply.findUnique({
        where: { id: parentId }
      });
      if (parent && parent.createdBy !== user.id && parent.createdBy !== discussion.createdBy) {
        await createNotification({
          userId: parent.createdBy,
          instituteId,
          title: "New reply to your comment",
          message: `${userName} commented: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
          type: NotificationType.DISCUSSION_REPLY,
          priority: NotificationPriority.NORMAL,
          actionUrl: `/dashboard/courses/${courseId}?tab=discussions&id=${discussionId}`
        }).catch(err => console.error("DISCUSSION_REPLY NESTED NOTIFICATION ERROR:", err));
      }
    }

    // Trigger Notification for OFFICIAL_ANSWER
    if (isOfficialAnswer && discussion.createdBy !== user.id) {
      await createNotification({
        userId: discussion.createdBy,
        instituteId,
        title: "Official answer marked",
        message: `An instructor has marked a reply as the official answer for: "${discussion.title}"`,
        type: NotificationType.OFFICIAL_ANSWER,
        priority: NotificationPriority.HIGH,
        actionUrl: `/dashboard/courses/${courseId}?tab=discussions&id=${discussionId}`
      }).catch(err => console.error("OFFICIAL_ANSWER NOTIFICATION ERROR:", err));
    }

    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error("POST DISCUSSION REPLY ERROR:", error);
    return NextResponse.json({ message: "Failed to create discussion reply" }, { status: 500 });
  }
}
