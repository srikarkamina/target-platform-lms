/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Set isRead=true for all unread notifications belonging to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully marked all notifications as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Tenant mismatch or invalid role
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { markAllNotificationsAsRead } from "@/lib/services/notification-service";

export async function PATCH(req: NextRequest) {
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

    const count = await markAllNotificationsAsRead(
      user.id,
      user.instituteId,
      user.role === "SUPER_ADMIN"
    );

    return NextResponse.json({
      message: "All notifications marked as read",
      count,
    });
  } catch (error: any) {
    console.error("PATCH READ-ALL ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
