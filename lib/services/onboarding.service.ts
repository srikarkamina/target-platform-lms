import { prisma } from "@/lib/prisma";

import {
  AccessRequestStatus,
  UserStatus,
  SubscriptionStatus,
  NotificationType,
  NotificationPriority,
  Role,
} from "@/app/generated/prisma/client";
import {
  getInstituteWelcomeEmail,
  getTemporaryPasswordEmail,
  getSubscriptionActivatedEmail,
} from "./email-template.service";
import { sendEmail } from "./resend";

export interface OnboardApprovalInput {
  accessRequestId: string;
  actorId: string;
  actorEmail: string;
  plan: string; // e.g. Free, Basic, Professional, Enterprise
  trialDurationDays: number; // 14, 30, 90
  generateTempPassword: boolean;
  sendWelcomeEmail: boolean;
  createInstitute: boolean;
  createInstituteAdmin: boolean;
}

export class OnboardingService {
  /**
   * Approves an Access Request and fully provisions the new tenant within a single database transaction.
   */
  static async approveAndOnboard(
    input: OnboardApprovalInput,
    ip?: string,
    userAgent?: string
  ) {
    const {
      accessRequestId,
      actorId,
      actorEmail,
      plan,
      trialDurationDays,
      generateTempPassword,
      sendWelcomeEmail,
      createInstitute,
      createInstituteAdmin,
    } = input;

    const rawTempPassword = "";

    let onboardedAdminEmail = "";
    let onboardedAdminName = "";
    let onboardedInstituteName = "";

    // Execute everything inside ONE database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch access request and set status to ONBOARDING
      const request = await tx.accessRequest.findUnique({
        where: { id: accessRequestId },
      });

      if (!request) {
        throw new Error("Access request not found.");
      }

      if (
        request.status !== AccessRequestStatus.UNDER_REVIEW &&
        request.status !== AccessRequestStatus.APPROVED &&
        request.status !== AccessRequestStatus.SUBMITTED
      ) {
        throw new Error(`Cannot onboard a request in ${request.status} status.`);
      }

      onboardedAdminEmail = request.email;
      onboardedAdminName = request.ownerName;
      onboardedInstituteName = request.instituteName;

      // Update Access Request to ONBOARDING state
      await tx.accessRequest.update({
        where: { id: accessRequestId },
        data: {
          status: AccessRequestStatus.ONBOARDING,
          approvedAt: new Date(),
          approvedBy: actorEmail,
        },
      });

      // Write Audit Log for Onboarding Started
      await tx.auditLog.create({
        data: {
          instituteId: "global",
          userId: actorId,
          action: "ONBOARDING_STARTED",
          module: "ACCESS_MANAGEMENT",
          entityType: "AccessRequest",
          entityId: accessRequestId,
          description: `Onboarding process started for ${request.instituteName} by ${actorEmail}`,
          ipAddress: ip || "unknown",
          userAgent: userAgent || "unknown",
          status: "SUCCESS",
        },
      });

      // 2. Create Institute record
      let instituteId = "";
      if (createInstitute) {
        const newInstitute = await tx.institute.create({
          data: {
            name: request.instituteName,
            logo: null,
            isDeleted: false,
          },
        });

        instituteId = newInstitute.id;

        // Write Audit Log for Institute Creation
        await tx.auditLog.create({
          data: {
            instituteId: newInstitute.id,
            userId: actorId,
            action: "INSTITUTE_CREATED",
            module: "INSTITUTE",
            entityType: "Institute",
            entityId: newInstitute.id,
            description: `Institute ${request.instituteName} created successfully`,
            ipAddress: ip || "unknown",
            userAgent: userAgent || "unknown",
            status: "SUCCESS",
          },
        });
      }

      // 3. Create Institute Admin record
      let adminId = "";
      if (createInstituteAdmin && instituteId) {
        // Check if email already taken
        const existingUser = await tx.user.findUnique({
          where: { email: request.email },
        });

        if (existingUser) {
          throw new Error(`Email ${request.email} is already registered to a user.`);
        }

        const adminUser = await tx.user.create({
          data: {
            name: request.ownerName,
            email: request.email,
            passwordHash: null,
            passwordSet: false,
            role: Role.ADMIN,
            instituteId,
            status: UserStatus.PENDING_INVITE,
            createdBy: actorId,
            provider: "credentials",
          },
        });

        adminId = adminUser.id;

        // Write Audit Log for Institute Admin Creation
        await tx.auditLog.create({
          data: {
            instituteId,
            userId: actorId,
            action: "INSTITUTE_ADMIN_CREATED",
            module: "USER",
            entityType: "User",
            entityId: adminUser.id,
            description: `Admin user ${request.ownerName} created for ${request.instituteName}`,
            ipAddress: ip || "unknown",
            userAgent: userAgent || "unknown",
            status: "SUCCESS",
          },
        });

        if (generateTempPassword) {
          // Log temporary password generation
          await tx.auditLog.create({
            data: {
              instituteId,
              userId: actorId,
              action: "TEMPORARY_PASSWORD_GENERATED",
              module: "USER",
              entityType: "User",
              entityId: adminUser.id,
              description: `Temporary login password generated for administrative user ${request.email}`,
              ipAddress: ip || "unknown",
              userAgent: userAgent || "unknown",
              status: "SUCCESS",
            },
          });
        }
      }

      // 4. Assign Subscription
      if (instituteId) {
        let planRecord = await tx.subscriptionPlan.findFirst({
          where: {
            OR: [
              { code: plan.toUpperCase() },
              { name: { contains: plan, mode: "insensitive" } },
            ],
          },
        });

        if (!planRecord) {
          // Fallback to first plan
          planRecord = await tx.subscriptionPlan.findFirst();
        }

        if (!planRecord) {
          throw new Error("No subscription plans found in system.");
        }

        const startsAt = new Date();
        const trialEndsAt = new Date(startsAt.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);

        const sub = await tx.subscription.create({
          data: {
            instituteId,
            planId: planRecord.id,
            status: SubscriptionStatus.TRIAL,
            startsAt,
            trialEndsAt,
            expiresAt: trialEndsAt,
            autoRenew: true,
          },
        });

        // Write Audit Log for Subscription Assignment
        await tx.auditLog.create({
          data: {
            instituteId,
            userId: actorId,
            action: "SUBSCRIPTION_ASSIGNED",
            module: "SUBSCRIPTION",
            entityType: "Subscription",
            entityId: sub.id,
            description: `Subscription ${planRecord.name} trial assigned to ${request.instituteName} (Trial Days: ${trialDurationDays})`,
            ipAddress: ip || "unknown",
            userAgent: userAgent || "unknown",
            status: "SUCCESS",
          },
        });
      }

      // 5. Create notifications in transaction
      if (adminId && instituteId) {
        // Notify new Institute Admin
        await tx.notification.create({
          data: {
            userId: adminId,
            instituteId,
            title: "Welcome to Target LMS",
            message: `Your administrator account for ${request.instituteName} is fully setup. Welcome aboard!`,
            type: NotificationType.GENERAL,
            priority: NotificationPriority.HIGH,
          },
        });
      }

      // Super admin audit log for completion
      await tx.auditLog.create({
        data: {
          instituteId: "global",
          userId: actorId,
          action: "ONBOARDING_COMPLETED",
          module: "ACCESS_MANAGEMENT",
          entityType: "AccessRequest",
          entityId: accessRequestId,
          description: `Onboarding completed successfully for ${request.instituteName}`,
          ipAddress: ip || "unknown",
          userAgent: userAgent || "unknown",
          status: "SUCCESS",
        },
      });

      // 6. Update access request status ➔ ACTIVE
      const activeRequest = await tx.accessRequest.update({
        where: { id: accessRequestId },
        data: {
          status: AccessRequestStatus.ACTIVE,
        },
      });

      return {
        request: activeRequest,
        rawTempPassword,
      };
    });

    // 7. Dispatch welcome credentials via Resend (AFTER transaction commit)
    if (sendWelcomeEmail && result.request.status === AccessRequestStatus.ACTIVE) {
      try {
        // Welcoming the new organization
        const welcomeHtml = getInstituteWelcomeEmail(
          onboardedAdminName,
          onboardedInstituteName,
          plan
        );
        await sendEmail({
          to: onboardedAdminEmail,
          subject: `Welcome to Target LMS - ${onboardedInstituteName}!`,
          html: welcomeHtml,
        });

        // Sending Credentials
        if (generateTempPassword) {
          const credsHtml = getTemporaryPasswordEmail(
            onboardedAdminName,
            onboardedAdminEmail,
            result.rawTempPassword
          );
          await sendEmail({
            to: onboardedAdminEmail,
            subject: "Your Target LMS Administrator Credentials",
            html: credsHtml,
          });
        }

        // Sending Subscription Activation
        const subHtml = getSubscriptionActivatedEmail(
          onboardedAdminName,
          onboardedInstituteName,
          plan,
          trialDurationDays
        );
        await sendEmail({
          to: onboardedAdminEmail,
          subject: `Subscription Activated - ${onboardedInstituteName}`,
          html: subHtml,
        });

        // Write audit log indicating welcome email sent
        await prisma.auditLog.create({
          data: {
            instituteId: result.request.id,
            action: "WELCOME_EMAIL_SENT",
            module: "ACCESS_MANAGEMENT",
            entityType: "AccessRequest",
            entityId: accessRequestId,
            description: `Welcome credentials emails successfully dispatched to ${onboardedAdminEmail}`,
            status: "SUCCESS",
            ipAddress: ip || "unknown",
            userAgent: userAgent || "unknown",
          },
        });
      } catch (err) {
        console.error("Failed to send Welcome/Credentials emails to onboarding admin:", err);
      }
    }

    return result.request;
  }
}
