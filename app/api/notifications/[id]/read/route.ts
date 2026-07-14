/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     description: Set isRead=true for a specific notification belonging to the authenticated user.
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
 *         description: Successfully marked the notification as read
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
import { markNotificationAsRead } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";

export async function PATCH(
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

    const notification = await markNotificationAsRead(
      id,
      user.id,
      user.instituteId,
      user.role === "SUPER_ADMIN"
    );

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "READ",
      module: "NOTIFICATIONS",
      entityType: "Notification",
      entityId: id,
      description: `Notification marked as read: ${notification.title}`,
      status: "SUCCESS",
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("PATCH READ ERROR:", error);

    if (error.message === "Notification not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.startsWith("Access denied")) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { message: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
