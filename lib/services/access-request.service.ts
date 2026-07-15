import { prisma } from "@/lib/prisma";
import { AccessRequestStatus, NotificationType, NotificationPriority } from "@/app/generated/prisma/client";
import {
  getAccessRequestSubmittedEmail,
  getAccessRequestUnderReviewEmail,
  getAccessRequestRejectedEmail,
} from "./email-template.service";
import { sendEmail } from "./resend";

export interface CreateAccessRequestInput {
  instituteName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  requestedPlan: string;
  message?: string;
}

export class AccessRequestService {
  /**
   * Submit a new Access Request
   */
  static async createRequest(input: CreateAccessRequestInput, ip?: string, userAgent?: string) {
    // 1. Duplicate check: Prevent duplicate SUBMITTED or UNDER_REVIEW requests from the same email
    const duplicate = await prisma.accessRequest.findFirst({
      where: {
        email: input.email,
        status: {
          in: [AccessRequestStatus.SUBMITTED, AccessRequestStatus.UNDER_REVIEW],
        },
      },
    });

    if (duplicate) {
      throw new Error("You already have a pending or active access request in review.");
    }

    // 2. Generate a unique request number (e.g., AR-2026-000001)
    const year = new Date().getFullYear();
    const count = await prisma.accessRequest.count({
      where: {
        requestNumber: {
          startsWith: `AR-${year}-`,
        },
      },
    });
    const serialNumber = String(count + 1).padStart(6, "0");
    const requestNumber = `AR-${year}-${serialNumber}`;

    // 3. Create request record in database
    const request = await prisma.accessRequest.create({
      data: {
        requestNumber,
        instituteName: input.instituteName,
        ownerName: input.ownerName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        state: input.state,
        country: input.country,
        website: input.website || null,
        requestedPlan: input.requestedPlan,
        message: input.message || null,
        status: AccessRequestStatus.SUBMITTED,
      },
    });

    // 4. Create Audit Log for Request Submission
    await prisma.auditLog.create({
      data: {
        instituteId: "global",
        action: "ACCESS_REQUEST_SUBMITTED",
        module: "ACCESS_MANAGEMENT",
        entityType: "AccessRequest",
        entityId: request.id,
        description: `Access request ${requestNumber} submitted for ${input.instituteName} by ${input.ownerName}`,
        ipAddress: ip || "unknown",
        userAgent: userAgent || "unknown",
        status: "SUCCESS",
      },
    });

    // 5. Notify Super Admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN", deletedAt: null },
      select: { id: true },
    });

    if (superAdmins.length > 0) {
      await prisma.notification.createMany({
        data: superAdmins.map((admin) => ({
          userId: admin.id,
          instituteId: "global",
          title: "New Access Request Submitted",
          message: `A new access request (${requestNumber}) has been submitted for ${input.instituteName}.`,
          type: NotificationType.GENERAL,
          priority: NotificationPriority.HIGH,
          actionUrl: `/dashboard/super-admin/access-requests/${request.id}`,
        })),
      });
    }

    // 6. Send receipt confirmation email to applicant (asynchronously)
    const emailHtml = getAccessRequestSubmittedEmail(
      input.ownerName,
      input.instituteName,
      requestNumber
    );
    sendEmail({
      to: input.email,
      subject: `Target LMS - Access Request Received [${requestNumber}]`,
      html: emailHtml,
    }).catch((err) => {
      console.error("Failed to send receipt email to applicant:", err);
    });

    return request;
  }

  /**
   * Get all access requests with filtering and pagination
   */
  static async getRequests(filters: {
    status?: AccessRequestStatus;
    plan?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.requestedPlan = filters.plan;
    }

    if (filters.search) {
      where.OR = [
        { requestNumber: { contains: filters.search, mode: "insensitive" } },
        { instituteName: { contains: filters.search, mode: "insensitive" } },
        { ownerName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.accessRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.accessRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get specific Access Request by ID
   */
  static async getRequestById(id: string) {
    const request = await prisma.accessRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new Error("Access request not found.");
    }
    return request;
  }

  /**
   * Perform manual lifecycle status changes (e.g. Move to Under Review or Cancel)
   */
  static async updateStatus(
    id: string,
    newStatus: AccessRequestStatus,
    actorId: string,
    actorEmail: string,
    reviewNotes?: string,
    ip?: string,
    userAgent?: string
  ) {
    const request = await this.getRequestById(id);
    const oldStatus = request.status;

    // Validate lifecycle transitions
    const isValidTransition = this.validateLifecycleTransition(oldStatus, newStatus);
    if (!isValidTransition) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}.`);
    }

    const updateData: any = {
      status: newStatus,
    };

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    if (newStatus === AccessRequestStatus.UNDER_REVIEW) {
      // Log review metadata if needed
    } else if (newStatus === AccessRequestStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.approvedBy = actorEmail;
    } else if (newStatus === AccessRequestStatus.CANCELLED) {
      // Cancel status logs
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: updateData,
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        instituteId: "global",
        userId: actorId,
        action: `ACCESS_REQUEST_${newStatus}`,
        module: "ACCESS_MANAGEMENT",
        entityType: "AccessRequest",
        entityId: id,
        description: `Access request ${request.requestNumber} transitioned from ${oldStatus} to ${newStatus} by ${actorEmail}`,
        ipAddress: ip || "unknown",
        userAgent: userAgent || "unknown",
        oldValues: { status: oldStatus },
        newValues: { status: newStatus, reviewNotes },
        status: "SUCCESS",
      },
    });

    // Notify Applicant & send corresponding email templates
    if (newStatus === AccessRequestStatus.UNDER_REVIEW) {
      // Send Under Review Email
      const emailHtml = getAccessRequestUnderReviewEmail(request.ownerName, request.requestNumber);
      sendEmail({
        to: request.email,
        subject: `Target LMS - Access Request Under Review [${request.requestNumber}]`,
        html: emailHtml,
      }).catch((err) => console.error("Under Review email error:", err));
    } else if (newStatus === AccessRequestStatus.REJECTED) {
      // Send Rejected Email
      const emailHtml = getAccessRequestRejectedEmail(
        request.ownerName,
        request.requestNumber,
        reviewNotes || "Business Decision",
        ""
      );
      sendEmail({
        to: request.email,
        subject: `Target LMS - Access Request Update [${request.requestNumber}]`,
        html: emailHtml,
      }).catch((err) => console.error("Rejection email error:", err));

      // Create internal notification for admins
      const superAdmins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN", deletedAt: null },
        select: { id: true },
      });
      if (superAdmins.length > 0) {
        await prisma.notification.createMany({
          data: superAdmins.map((admin) => ({
            userId: admin.id,
            instituteId: "global",
            title: "Access Request Rejected",
            message: `Access request (${request.requestNumber}) has been rejected by ${actorEmail}.`,
            type: NotificationType.GENERAL,
            priority: NotificationPriority.NORMAL,
            actionUrl: `/dashboard/super-admin/access-requests/${request.id}`,
          })),
        });
      }
    }

    return updatedRequest;
  }

  /**
   * Enforce Lifecycle State Transition Rules
   */
  private static validateLifecycleTransition(
    current: AccessRequestStatus,
    target: AccessRequestStatus
  ): boolean {
    if (current === target) return true;

    // Super Admins can transition "Any State" to CANCELLED (as a terminal state)
    if (target === AccessRequestStatus.CANCELLED) {
      return true;
    }

    switch (current) {
      case AccessRequestStatus.DRAFT:
        return target === AccessRequestStatus.SUBMITTED;
      case AccessRequestStatus.SUBMITTED:
        return target === AccessRequestStatus.UNDER_REVIEW;
      case AccessRequestStatus.UNDER_REVIEW:
        return (
          target === AccessRequestStatus.APPROVED ||
          target === AccessRequestStatus.REJECTED
        );
      case AccessRequestStatus.APPROVED:
        return target === AccessRequestStatus.ONBOARDING;
      case AccessRequestStatus.ONBOARDING:
        return target === AccessRequestStatus.ACTIVE;
      case AccessRequestStatus.ACTIVE:
      case AccessRequestStatus.REJECTED:
      case AccessRequestStatus.CANCELLED:
        // Terminal states cannot change status further
        return false;
      default:
        return false;
    }
  }
}
