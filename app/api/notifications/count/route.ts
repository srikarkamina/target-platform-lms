/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Retrieve unread notifications count
 *     description: Returns the total count of unread, non-expired, and non-deleted notifications for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Tenant mismatch or invalid role
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
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

    const where: Prisma.NotificationWhereInput = {
      deletedAt: null,
      userId: user.id,
      isRead: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    // Tenant Isolation
    if (user.role !== "SUPER_ADMIN") {
      if (!user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: User does not belong to any institute" },
          { status: 403 }
        );
      }
      where.instituteId = user.instituteId;
    }

    const unread = await prisma.notification.count({
      where,
    });

    return NextResponse.json({
      success: true,
      data: {
        unread,
      },
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS COUNT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
