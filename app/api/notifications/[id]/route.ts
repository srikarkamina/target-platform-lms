/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Soft delete a specific notification
 *     description: Sets the deletedAt timestamp on a notification record, marking it as deleted.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID (UUID)
 *     responses:
 *       200:
 *         description: Successfully deleted the notification
 *       400:
 *         description: Bad Request - invalid ID format
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - ownership or tenant mismatch
 *       404:
 *         description: Not Found - notification not found
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { notificationIdParamSchema } from "@/lib/validations/notification";
import { softDeleteNotification } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: User not found in database" },
        { status: 401 }
      );
    }

    // Role validation
    if (!["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Invalid user role" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const validation = notificationIdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }

    await softDeleteNotification(
      id,
      user.id,
      user.instituteId,
      user.role === "SUPER_ADMIN"
    );

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "DELETE",
      module: "NOTIFICATIONS",
      entityType: "Notification",
      entityId: id,
      description: `Notification deleted`,
      status: "SUCCESS",
    });

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    if (error.message === "Notification not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.startsWith("Access denied")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { message: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}
