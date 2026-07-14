import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

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

    // Role verification: Only Super Admin can respond/update status
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id: params.id, deletedAt: null }
    });

    if (!feedback) {
      return NextResponse.json({ message: "Feedback entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const adminResponse = body.adminResponse as string | undefined;
    const status = body.status as string | undefined;
    const priority = body.priority as string | undefined;

    const dataToUpdate: any = {};
    if (adminResponse !== undefined) {
      dataToUpdate.adminResponse = adminResponse.trim();
      dataToUpdate.adminResponseAt = new Date();
      dataToUpdate.adminResponseById = user.id;
    }
    if (status !== undefined) {
      dataToUpdate.status = status;
    }
    if (priority !== undefined) {
      dataToUpdate.priority = priority;
    }

    const updatedFeedback = await prisma.$transaction(async (tx) => {
      const result = await tx.feedback.update({
        where: { id: params.id },
        data: dataToUpdate
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: feedback.instituteId,
        action: "RESPOND_FEEDBACK",
        module: "FEEDBACK",
        entityType: "Feedback",
        entityId: feedback.id,
        description: `Super Admin responded/updated feedback: ${feedback.id}`
      });

      return result;
    });

    // Notify the institute admin creator if they chose not to remain anonymous
    if (!feedback.anonymous) {
      await createNotification({
        userId: feedback.createdBy,
        instituteId: feedback.instituteId,
        title: "Super Admin updated your platform feedback",
        message: adminResponse 
          ? `Super Admin replied: "${adminResponse.substring(0, 50)}${adminResponse.length > 50 ? "..." : ""}"`
          : `Feedback status set to ${status || feedback.status}`,
        type: NotificationType.FEEDBACK_RESPONSE,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/feedback`
      }).catch(err => console.error("FEEDBACK_RESPONSE NOTIFICATION ERROR:", err));
    }

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error("PATCH FEEDBACK DETAIL ERROR:", error);
    return NextResponse.json({ message: "Failed to update feedback", error: String(error) }, { status: 500 });
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
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const feedback = await prisma.feedback.findFirst({
      where: { id: params.id, deletedAt: null }
    });

    if (!feedback) {
      return NextResponse.json({ message: "Feedback entry not found" }, { status: 404 });
    }

    await prisma.feedback.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    // Audit Log
    await logAction({
      req,
      userId: user.id,
      instituteId: feedback.instituteId,
      action: "DELETE_FEEDBACK",
      module: "FEEDBACK",
      entityType: "Feedback",
      entityId: feedback.id,
      description: `Super Admin deleted feedback: ${feedback.id}`
    });

    return NextResponse.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("DELETE FEEDBACK ERROR:", error);
    return NextResponse.json({ message: "Failed to delete feedback" }, { status: 500 });
  }
}
