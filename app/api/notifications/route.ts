/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     description: Retrieve a paginated list of notifications for the currently logged-in user. Supports filtering by read status, priority, notification type, expiration, and date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of notifications to return per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter notifications by read/unread status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *         description: Filter notifications by priority level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ASSIGNMENT_CREATED, ASSIGNMENT_DUE, QUIZ_PUBLISHED, QUIZ_DUE, COURSE_ENROLLED, COURSE_COMPLETED, CERTIFICATE_ISSUED, CERTIFICATE_REVOKED, GENERAL]
 *         description: Filter notifications by type
 *       - in: query
 *         name: expired
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: If true, includes expired notifications. If false (default), excludes them.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notifications created on or after this timestamp
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notifications created on or before this timestamp
 *     responses:
 *       200:
 *         description: A paginated list of notifications
 *       400:
 *         description: Bad Request - validation errors
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - tenant mismatch or invalid role
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { getNotificationsQuerySchema } from "@/lib/validations/notification";
import { Prisma } from "@/app/generated/prisma/client";
import { triggerScheduledNotifications } from "@/lib/services/notification-service";

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

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = getNotificationsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, isRead, priority, type, expired, startDate, endDate } = validation.data;

    const where: Prisma.NotificationWhereInput = {
      deletedAt: null,
      userId: user.id,
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

    // Trigger scheduled notifications just-in-time
    const targetInstituteId = user.instituteId || "global";
    await triggerScheduledNotifications(targetInstituteId).catch((err) => {
      console.error("Scheduled notifications trigger failed:", err);
    });

    // Filter by read status if provided
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    // Filter by priority if provided
    if (priority) {
      where.priority = priority;
    }

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    // Exclude expired notifications by default (unless explicitly requested)
    if (!expired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }

    // Filter by creation date range if provided
    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      };
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
