import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCourseAccess } from "@/lib/authorization";

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

    // Prevent duplicate likes
    const existing = await prisma.discussionLike.findUnique({
      where: {
        discussionId_userId: {
          discussionId,
          userId: user.id
        }
      }
    });

    if (existing) {
      if (existing.deletedAt !== null) {
        await prisma.discussionLike.update({
          where: { id: existing.id },
          data: { deletedAt: null }
        });
      }
    } else {
      await prisma.discussionLike.create({
        data: {
          discussionId,
          userId: user.id,
          instituteId,
          createdBy: user.id
        }
      });
    }

    return NextResponse.json({ success: true, message: "Thread liked successfully" });
  } catch (error) {
    console.error("LIKE DISCUSSION ERROR:", error);
    return NextResponse.json({ message: "Failed to like thread" }, { status: 500 });
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

    // Soft delete the like
    await prisma.discussionLike.updateMany({
      where: {
        discussionId,
        userId: user.id,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Thread unliked successfully" });
  } catch (error) {
    console.error("UNLIKE DISCUSSION ERROR:", error);
    return NextResponse.json({ message: "Failed to unlike thread" }, { status: 500 });
  }
}
