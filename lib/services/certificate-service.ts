import { prisma } from "@/lib/prisma";
import { CertificateTemplate, Certificate } from "@/app/generated/prisma/client";
import {
  generateCertificateNumber,
  generateCertificateCode,
  generateVerificationToken,
} from "@/lib/certificate";

/**
 * Retrieves a certificate template from the database and ensures it belongs to the matching tenant.
 *
 * @param id - Template ID.
 * @param instituteId - Tenant ID for enforcement.
 */
export async function getTemplate(
  id: string,
  instituteId: string
): Promise<CertificateTemplate> {
  const template = await prisma.certificateTemplate.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!template) {
    throw new Error("Certificate template not found");
  }

  if (template.instituteId !== instituteId) {
    throw new Error("Tenant mismatch: Access denied");
  }

  return template;
}

/**
 * Validates whether the given template is active and ready to be used.
 *
 * @param template - The CertificateTemplate instance.
 */
export function validateTemplate(template: CertificateTemplate): void {
  if (!template.isActive) {
    throw new Error("Certificate template is inactive");
  }
}

/**
 * Checks if a student already has an active, non-deleted certificate for a specific course.
 *
 * @param studentId - User ID of the student.
 * @param courseId - Course ID.
 */
export async function checkDuplicateCertificate(
  studentId: string,
  courseId: string
): Promise<Certificate | null> {
  return await prisma.certificate.findFirst({
    where: {
      studentId,
      courseId,
      deletedAt: null,
    },
  });
}

interface PrepareCertificateParams {
  studentId: string;
  courseId: string;
  templateId: string;
  instituteId: string;
  completionDate?: Date;
}

/**
 * Prepares certificate creation metadata, generating standard certificate number,
 * short code, and secure verification token.
 */
export async function prepareCertificateMetadata(params: PrepareCertificateParams) {
  // Determine sequence number based on tenant certificate count
  const count = await prisma.certificate.count({
    where: {
      instituteId: params.instituteId,
    },
  });

  const nextSequence = count + 1;
  const certificateNumber = generateCertificateNumber(nextSequence);
  const certificateCode = generateCertificateCode();
  const verificationToken = generateVerificationToken();

  return {
    instituteId: params.instituteId,
    studentId: params.studentId,
    courseId: params.courseId,
    templateId: params.templateId,
    certificateNumber,
    certificateCode,
    verificationToken,
    issueDate: new Date(),
    completionDate: params.completionDate || new Date(),
    status: "ACTIVE" as const,
  };
}

/**
 * Validates eligibility and generates a new certificate inside a database transaction.
 */
export async function generateCertificate(params: PrepareCertificateParams): Promise<Certificate> {
  const { studentId, courseId, templateId, instituteId, completionDate } = params;

  // 1. Validate student exists, belongs to tenant, and role is STUDENT
  const student = await prisma.user.findUnique({
    where: { id: studentId, deletedAt: null },
  });
  if (!student) {
    throw new Error("Student not found");
  }
  if (student.role !== "STUDENT") {
    throw new Error("User is not a student");
  }
  if (student.instituteId !== instituteId) {
    throw new Error("Student does not belong to this institute");
  }

  // 2. Validate course exists and belongs to tenant
  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) {
    throw new Error("Course not found");
  }
  if (course.instituteId !== instituteId) {
    throw new Error("Course does not belong to this institute");
  }

  // 3. Validate template exists, is active, and belongs to tenant
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: templateId, deletedAt: null },
  });
  if (!template) {
    throw new Error("Certificate template not found");
  }
  if (!template.isActive) {
    throw new Error("Certificate template is inactive");
  }
  if (template.instituteId !== instituteId) {
    throw new Error("Template does not belong to this institute");
  }

  // 4. Validate course completion (all published videos completed)
  const totalVideos = await prisma.video.count({
    where: { courseId, published: true, deletedAt: null },
  });

  const completedVideos = await prisma.progress.count({
    where: {
      userId: studentId,
      completed: true,
      video: { courseId, published: true, deletedAt: null },
    },
  });

  if (totalVideos > 0 && completedVideos < totalVideos) {
    throw new Error(`Student has not completed all lessons of this course (${completedVideos}/${totalVideos} completed)`);
  }

  // 5. Execute transaction to prevent race conditions & double generation
  return await prisma.$transaction(async (tx) => {
    const duplicate = await tx.certificate.findFirst({
      where: {
        studentId,
        courseId,
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw new Error("Certificate already exists for this student and course");
    }

    const count = await tx.certificate.count({
      where: { instituteId },
    });

    const nextSequence = count + 1;
    const certificateNumber = generateCertificateNumber(nextSequence);
    const certificateCode = generateCertificateCode();
    const verificationToken = generateVerificationToken();

    const certificate = await tx.certificate.create({
      data: {
        instituteId,
        studentId,
        courseId,
        templateId,
        certificateNumber,
        certificateCode,
        verificationToken,
        completionDate: completionDate || new Date(),
        issueDate: new Date(),
        status: "ACTIVE",
        fileSize: 250000, // Est. 250 KB
      },
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      await SubscriptionService.takeUsageSnapshot(instituteId);
    } catch (snapshotErr) {
      console.error("[SNAPSHOT FAILURE] Failed to record usage snapshot on certificate generation:", snapshotErr);
    }

    return certificate;
  });
}

