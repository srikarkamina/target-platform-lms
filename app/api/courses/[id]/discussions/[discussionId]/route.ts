import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCourseAccess } from "@/lib/authorization";
import { updateDiscussionSchema } from "@/lib/validations/discussion";
import { logAction } from "@/lib/services/audit-service";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string; discussionId: string }> }) {
  const params = await props.params;
  const { id: courseId, discussionId } = params;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const user = authResult.user!;
    const discussion = await prisma.discussion.findFirst({
      where: { id: discussionId, courseId, deletedAt: null }
    });

    if (!discussion) {
      return NextResponse.json({ message: "Discussion thread not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateDiscussionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { title, content, pinned, locked } = validation.data;

    // Authorization checks:
    // 1. Regular user wants to edit title/content: must be the creator and thread must not be locked
    const hasEditContent = title !== undefined || content !== undefined;
    if (hasEditContent) {
      if (discussion.createdBy !== user.id) {
        return NextResponse.json({ message: "Forbidden: You are not the author of this thread" }, { status: 403 });
      }
      if (discussion.locked && !["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json({ message: "Forbidden: This thread is locked and read-only" }, { status: 403 });
      }
    }

    // 2. Pin/Lock: only Faculty or Admin/Super Admin
    const hasPinLockChange = pinned !== undefined || locked !== undefined;
    if (hasPinLockChange) {
      if (!["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json({ message: "Forbidden: Only faculty or administrators can lock/pin discussions" }, { status: 403 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.discussion.update({
        where: { id: discussionId },
        data: {
          title: title !== undefined ? title : undefined,
          content: content !== undefined ? content : undefined,
          pinned: pinned !== undefined ? pinned : undefined,
          locked: locked !== undefined ? locked : undefined
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
        instituteId: discussion.instituteId,
        action: "UPDATE_DISCUSSION",
        module: "DISCUSSIONS",
        entityType: "Discussion",
        entityId: discussionId,
        description: `Updated discussion thread: ${discussion.title}`,
        oldValues: discussion,
        newValues: result
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH DISCUSSION ERROR:", error);
    return NextResponse.json({ message: "Failed to update discussion thread" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string; discussionId: string }> }) {
  const params = await props.params;
  const { id: courseId, discussionId } = params;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const user = authResult.user!;
    const discussion = await prisma.discussion.findFirst({
      where: { id: discussionId, courseId, deletedAt: null }
    });

    if (!discussion) {
      return NextResponse.json({ message: "Discussion thread not found" }, { status: 404 });
    }

    // Authorize deletion: creator OR faculty of this course OR admin/super_admin
    const isCreator = discussion.createdBy === user.id;
    const isFaculty = user.role === "FACULTY" && authResult.course?.facultyId === user.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

    if (!isCreator && !isFaculty && !isAdmin) {
      return NextResponse.json({ message: "Forbidden: You do not have permissions to delete this thread" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.discussion.update({
        where: { id: discussionId },
        data: { deletedAt: new Date() }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: discussion.instituteId,
        action: "DELETE_DISCUSSION",
        module: "DISCUSSIONS",
        entityType: "Discussion",
        entityId: discussionId,
        description: `Deleted discussion thread: ${discussion.title}`
      });
    });

    return NextResponse.json({ message: "Discussion thread deleted successfully" });
  } catch (error) {
    console.error("DELETE DISCUSSION ERROR:", error);
    return NextResponse.json({ message: "Failed to delete discussion thread" }, { status: 500 });
  }
}
