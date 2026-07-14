import { prisma } from "@/lib/prisma";
import { BackupType, BackupStatus } from "@/app/generated/prisma/client";
import { SubscriptionService } from "@/lib/services/subscription-service";

export class BackupService {
  /**
   * Create a new backup metadata record in PENDING status.
   */
  static async createBackupMetadata(params: {
    type: BackupType;
    createdBy: string;
    notes?: string;
  }) {
    // Generate default filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `lms-backup-${params.type.toLowerCase()}-${timestamp}.json`;

    return await prisma.backup.create({
      data: {
        type: params.type,
        status: "PENDING",
        fileName,
        fileSize: 0, // initially 0, updated on success
        createdBy: params.createdBy,
        notes: params.notes || null,
      },
    });
  }

  /**
   * Update the status and details of an existing backup record.
   */
  static async updateBackupStatus(
    id: string,
    params: {
      status: BackupStatus;
      fileSize?: number;
      completedAt?: Date;
      notes?: string;
    }
  ) {
    return await prisma.backup.update({
      where: { id },
      data: {
        status: params.status,
        fileSize: params.fileSize !== undefined ? params.fileSize : undefined,
        completedAt: params.completedAt !== undefined ? params.completedAt : undefined,
        notes: params.notes !== undefined ? params.notes : undefined,
      },
    });
  }

  /**
   * List all backup records ordered by creation date descending.
   */
  static async listBackups() {
    return await prisma.backup.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Estimates backup package size by aggregating:
   * - Estimated database records size (mapping record counts to standard KB weight estimate).
   * - Real storage sizes of uploads (Videos, Templates, Submissions, Certificates, Settings branding assets).
   * Returns size in MB.
   */
  static async estimateBackupSize(): Promise<number> {
    try {
      // 1. Record counts in database
      const [
        userCount,
        courseCount,
        videoCount,
        certCount,
        quizCount,
        submissionCount,
        auditCount,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.video.count({ where: { deletedAt: null } }),
        prisma.certificate.count({ where: { deletedAt: null } }),
        prisma.quiz.count({ where: { deletedAt: null } }),
        prisma.submission.count(),
        prisma.auditLog.count(),
      ]);

      // Row size estimate weights in Bytes
      const USER_ROW_BYTES = 1024; // 1 KB
      const COURSE_ROW_BYTES = 2048; // 2 KB
      const VIDEO_ROW_BYTES = 1024; // 1 KB
      const CERT_ROW_BYTES = 3072; // 3 KB
      const QUIZ_ROW_BYTES = 4096; // 4 KB
      const SUBMISSION_ROW_BYTES = 2048; // 2 KB
      const AUDIT_ROW_BYTES = 512; // 0.5 KB

      const totalDbEstimateBytes =
        userCount * USER_ROW_BYTES +
        courseCount * COURSE_ROW_BYTES +
        videoCount * VIDEO_ROW_BYTES +
        certCount * CERT_ROW_BYTES +
        quizCount * QUIZ_ROW_BYTES +
        submissionCount * SUBMISSION_ROW_BYTES +
        auditCount * AUDIT_ROW_BYTES;

      // 2. Storage files size sum from DB metadata
      // Videos, Submissions, Templates background/signature, Certificates, branding logos/banners
      // SubscriptionService.calculateStorageUsedMB returns MB, let's fetch it across all institutes
      const institutes = await prisma.institute.findMany({
        where: { isDeleted: false },
        select: { id: true },
      });

      let totalStorageBytes = 0;
      for (const inst of institutes) {
        const storageMB = await SubscriptionService.calculateStorageUsedMB(inst.id);
        totalStorageBytes += storageMB * 1024 * 1024;
      }

      // Add global branding assets/logo sizes
      const globalSettings = await prisma.instituteSettings.findFirst({
        where: { instituteId: "global" },
      });

      if (globalSettings) {
        totalStorageBytes += (globalSettings.logoSize || 0);
        totalStorageBytes += (globalSettings.bannerSize || 0);
        totalStorageBytes += (globalSettings.faviconSize || 0);
        totalStorageBytes += (globalSettings.defaultSignatureImageSize || 0);
        totalStorageBytes += (globalSettings.defaultSealImageSize || 0);
      }

      const totalMB = (totalDbEstimateBytes + totalStorageBytes) / (1024 * 1024);
      return parseFloat(totalMB.toFixed(2));
    } catch (err) {
      console.error("[ESTIMATE BACKUP SIZE ERROR]", err);
      return 10.5; // fallback default estimate in MB
    }
  }

  /**
   * Generates a metadata manifest of the backup database status.
   */
  static async generateBackupManifest() {
    const [
      userCount,
      courseCount,
      videoCount,
      certCount,
      quizCount,
      submissionCount,
      auditCount,
      institutesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.video.count({ where: { deletedAt: null } }),
      prisma.certificate.count({ where: { deletedAt: null } }),
      prisma.quiz.count({ where: { deletedAt: null } }),
      prisma.submission.count(),
      prisma.auditLog.count(),
      prisma.institute.count({ where: { isDeleted: false } }),
    ]);

    const estimatedSizeMB = await this.estimateBackupSize();

    return {
      manifestVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      platformVersion: "v1.4.2-prod",
      systemDetails: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      databaseMetrics: {
        totalUsers: userCount,
        totalInstitutes: institutesCount,
        totalCourses: courseCount,
        totalVideos: videoCount,
        totalCertificates: certCount,
        totalQuizzes: quizCount,
        totalSubmissions: submissionCount,
        totalAuditLogs: auditCount,
      },
      fileStorage: {
        estimatedSizeMB,
      },
    };
  }
}
