import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/app/generated/prisma/enums";

export interface SubscriptionUsage {
  planName: string;
  planCode: string;
  price: number;
  status: SubscriptionStatus;
  startsAt: Date;
  expiresAt: Date | null;
  trialEndsAt: Date | null;
  autoRenew: boolean;
  trialRemainingDays: number | null;
  limits: {
    students: number | null;
    faculty: number | null;
    courses: number | null;
    admins: number | null;
    storageLimitGB: number | null;
  };
  usage: {
    students: number;
    faculty: number;
    courses: number;
    admins: number;
    storageUsedMB: number;
  };
  remaining: {
    students: number | null;
    faculty: number | null;
    courses: number | null;
    admins: number | null;
    storageRemainingMB: number | null;
  };
  percentages: {
    students: number;
    faculty: number;
    courses: number;
    admins: number;
    storage: number;
  };
}

export class SubscriptionService {
  /**
   * Helper that checks for trial expiration and transitions status automatically.
   */
  public static async getOrUpdateSubscription(instituteId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { instituteId },
      include: { plan: true },
    });

    if (!sub) return null;

    if (sub.status === "TRIAL" && sub.trialEndsAt && sub.trialEndsAt < new Date()) {
      // Auto transition to EXPIRED
      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
        include: { plan: true },
      });

      // Write System Audit Log
      try {
        await prisma.auditLog.create({
          data: {
            instituteId,
            userId: null,
            action: "UPDATE",
            module: "SYSTEM",
            entityType: "Subscription",
            entityId: updated.id,
            description: `Trial expired. Plan auto-marked as EXPIRED (Trial ended: ${sub.trialEndsAt.toISOString()})`,
            oldValues: JSON.stringify(sub),
            newValues: JSON.stringify(updated),
            status: "SUCCESS",
          },
        });
      } catch (err) {
        console.error("Failed to log auto trial expiration:", err);
      }

      return updated;
    }

    return sub;
  }

  /**
   * Centralized Storage Calculator incorporating logo, banner, favicon, signatures, backgrounds, seals, videos, and student submissions.
   */
  public static async calculateStorageUsedMB(instituteId: string): Promise<number> {
    const [
      videoStorage,
      submissionStorage,
      certTemplateStorage,
      certStorage,
      settingsStorage
    ] = await Promise.all([
      // 1. Videos
      prisma.video.aggregate({
        where: { course: { instituteId }, deletedAt: null },
        _sum: { fileSize: true },
      }),
      // 2. Student Submissions
      prisma.submission.aggregate({
        where: { assignment: { course: { instituteId }, deletedAt: null } },
        _sum: { fileSize: true },
      }),
      // 3. Certificate Templates (BackgroundImage + SignatureImage)
      prisma.certificateTemplate.aggregate({
        where: { instituteId, deletedAt: null },
        _sum: { backgroundImageSize: true, signatureImageSize: true },
      }),
      // 4. Issued Certificates PDFs
      prisma.certificate.aggregate({
        where: { instituteId, deletedAt: null },
        _sum: { fileSize: true },
      }),
      // 5. Settings / Branding Assets
      prisma.instituteSettings.findUnique({
        where: { instituteId },
        select: {
          logoSize: true,
          bannerSize: true,
          faviconSize: true,
          defaultSignatureImageSize: true,
          defaultSealImageSize: true,
        }
      })
    ]);

    const videoBytes = videoStorage._sum.fileSize || 0;
    const submissionBytes = submissionStorage._sum.fileSize || 0;
    const templateBytes = (certTemplateStorage._sum.backgroundImageSize || 0) + (certTemplateStorage._sum.signatureImageSize || 0);
    const certBytes = certStorage._sum.fileSize || 0;

    let settingsBytes = 0;
    if (settingsStorage) {
      settingsBytes = 
        (settingsStorage.logoSize || 0) + 
        (settingsStorage.bannerSize || 0) + 
        (settingsStorage.faviconSize || 0) + 
        (settingsStorage.defaultSignatureImageSize || 0) + 
        (settingsStorage.defaultSealImageSize || 0);
    }

    const totalBytes = videoBytes + submissionBytes + templateBytes + certBytes + settingsBytes;
    return parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
  }

  /**
   * Fetch subscription details and calculated limits usage for an institute.
   */
  public static async getSubscriptionUsage(instituteId: string): Promise<SubscriptionUsage | null> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return null;

    const plan = sub.plan;

    // Fetch usages in parallel
    const [
      studentCount,
      facultyCount,
      adminCount,
      courseCount,
      storageUsedMB
    ] = await Promise.all([
      prisma.user.count({ where: { instituteId, role: "STUDENT", deletedAt: null } }),
      prisma.user.count({ where: { instituteId, role: "FACULTY", deletedAt: null } }),
      prisma.user.count({ where: { instituteId, role: "ADMIN", deletedAt: null } }),
      prisma.course.count({ where: { instituteId, deletedAt: null } }),
      this.calculateStorageUsedMB(instituteId)
    ]);

    // Storage math
    let storageRemainingMB: number | null = null;
    let pctStorage = 0;
    if (plan.storageLimitGB !== null) {
      const storageLimitMB = plan.storageLimitGB * 1024;
      storageRemainingMB = Math.max(0, storageLimitMB - storageUsedMB);
      pctStorage = Math.min(100, Math.round((storageUsedMB / storageLimitMB) * 100));
    }

    // Remaining capacity calculations
    const remainingStudents = plan.maxStudents !== null ? Math.max(0, plan.maxStudents - studentCount) : null;
    const remainingFaculty = plan.maxFaculty !== null ? Math.max(0, plan.maxFaculty - facultyCount) : null;
    const remainingCourses = plan.maxCourses !== null ? Math.max(0, plan.maxCourses - courseCount) : null;
    const remainingAdmins = plan.maxAdmins !== null ? Math.max(0, plan.maxAdmins - adminCount) : null;

    // Percentage values (0 for unlimited)
    const pctStudents = plan.maxStudents !== null ? Math.min(100, Math.round((studentCount / plan.maxStudents) * 100)) : 0;
    const pctFaculty = plan.maxFaculty !== null ? Math.min(100, Math.round((facultyCount / plan.maxFaculty) * 100)) : 0;
    const pctCourses = plan.maxCourses !== null ? Math.min(100, Math.round((courseCount / plan.maxCourses) * 100)) : 0;
    const pctAdmins = plan.maxAdmins !== null ? Math.min(100, Math.round((adminCount / plan.maxAdmins) * 100)) : 0;

    let trialRemainingDays: number | null = null;
    if (sub.status === "TRIAL" && sub.trialEndsAt) {
      const diffTime = sub.trialEndsAt.getTime() - Date.now();
      trialRemainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      planName: plan.name,
      planCode: plan.code,
      price: plan.price,
      status: sub.status,
      startsAt: sub.startsAt,
      expiresAt: sub.expiresAt,
      trialEndsAt: sub.trialEndsAt,
      autoRenew: sub.autoRenew,
      trialRemainingDays,
      limits: {
        students: plan.maxStudents,
        faculty: plan.maxFaculty,
        courses: plan.maxCourses,
        admins: plan.maxAdmins,
        storageLimitGB: plan.storageLimitGB,
      },
      usage: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        admins: adminCount,
        storageUsedMB,
      },
      remaining: {
        students: remainingStudents,
        faculty: remainingFaculty,
        courses: remainingCourses,
        admins: remainingAdmins,
        storageRemainingMB,
      },
      percentages: {
        students: pctStudents,
        faculty: pctFaculty,
        courses: pctCourses,
        admins: pctAdmins,
        storage: pctStorage,
      },
    };
  }

  /**
   * Check if adding a student is permitted. Enforces Trial Expiration blocks.
   */
  public static async checkStudentLimit(instituteId: string): Promise<boolean> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return false;
    
    // Block expired/suspended plans
    if (sub.status === "EXPIRED" || sub.status === "SUSPENDED") return false;
    if (sub.plan.maxStudents === null) return true;

    const count = await prisma.user.count({
      where: { instituteId, role: "STUDENT", deletedAt: null },
    });
    return count < sub.plan.maxStudents;
  }

  /**
   * Check if adding a faculty member is permitted. Enforces Trial Expiration blocks.
   */
  public static async checkFacultyLimit(instituteId: string): Promise<boolean> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return false;
    
    // Block expired/suspended plans
    if (sub.status === "EXPIRED" || sub.status === "SUSPENDED") return false;
    if (sub.plan.maxFaculty === null) return true;

    const count = await prisma.user.count({
      where: { instituteId, role: "FACULTY", deletedAt: null },
    });
    return count < sub.plan.maxFaculty;
  }

  /**
   * Check if adding a course is permitted. Enforces Trial Expiration blocks.
   */
  public static async checkCourseLimit(instituteId: string): Promise<boolean> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return false;
    
    // Block expired/suspended plans
    if (sub.status === "EXPIRED" || sub.status === "SUSPENDED") return false;
    if (sub.plan.maxCourses === null) return true;

    const count = await prisma.course.count({
      where: { instituteId, deletedAt: null },
    });
    return count < sub.plan.maxCourses;
  }

  /**
   * Check if adding an admin is permitted.
   */
  public static async checkAdminLimit(instituteId: string): Promise<boolean> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return false;
    
    // Block expired/suspended plans
    if (sub.status === "EXPIRED" || sub.status === "SUSPENDED") return false;
    if (sub.plan.maxAdmins === null) return true;

    const count = await prisma.user.count({
      where: { instituteId, role: "ADMIN", deletedAt: null },
    });
    return count < sub.plan.maxAdmins;
  }

  /**
   * Check if an upcoming file upload fits within the storage limit.
   */
  public static async checkStorageLimit(instituteId: string, incomingBytes: number): Promise<boolean> {
    const sub = await this.getOrUpdateSubscription(instituteId);
    if (!sub) return false;
    
    // Block expired/suspended plans
    if (sub.status === "EXPIRED" || sub.status === "SUSPENDED") return false;
    if (sub.plan.storageLimitGB === null) return true;

    const totalStorageMB = await this.calculateStorageUsedMB(instituteId);
    const limitMB = sub.plan.storageLimitGB * 1024;
    const incomingMB = incomingBytes / (1024 * 1024);

    return totalStorageMB + incomingMB <= limitMB;
  }

  /**
   * Record a snapshot of usage stats for analytical logs.
   */
  public static async takeUsageSnapshot(instituteId: string): Promise<void> {
    if (!instituteId || instituteId === "global") return;
    
    const [
      studentCount,
      facultyCount,
      adminCount,
      courseCount,
      storageUsedMB
    ] = await Promise.all([
      prisma.user.count({ where: { instituteId, role: "STUDENT", deletedAt: null } }),
      prisma.user.count({ where: { instituteId, role: "FACULTY", deletedAt: null } }),
      prisma.user.count({ where: { instituteId, role: "ADMIN", deletedAt: null } }),
      prisma.course.count({ where: { instituteId, deletedAt: null } }),
      this.calculateStorageUsedMB(instituteId)
    ]);

    await prisma.usageSnapshot.create({
      data: {
        instituteId,
        students: studentCount,
        faculty: facultyCount,
        admins: adminCount,
        courses: courseCount,
        storageUsedMB,
      },
    });
  }
}
