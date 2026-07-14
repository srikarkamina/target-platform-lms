import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

import { getAuthorizedUser } from "@/lib/authorization";
import { generateCertificateSchema } from "@/lib/validations/certificate";
import { generateCertificate } from "@/lib/services/certificate-service";
import { notifyCertificateIssued } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";


/**
 * POST /api/certificates/generate
 * Programmatically generates a certificate for a student.
 * Restricted to ADMIN and SUPER_ADMIN.
 */
export async function POST(req: NextRequest) {
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

    // Role check: Only ADMIN and SUPER_ADMIN can manually/programmatically issue certificates
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can generate certificates" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Zod Validation
    const validationResult = generateCertificateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { studentId, courseId, templateId, completionDate } = validationResult.data;

    // Resolve tenant ID
    let targetInstituteId = user.instituteId;
    if (user.role === "SUPER_ADMIN") {
      targetInstituteId = body.instituteId || user.instituteId;
    }

    if (!targetInstituteId) {
      return NextResponse.json(
        { message: "Institute ID is required and could not be resolved" },
        { status: 400 }
      );
    }

    // Invoke Service Engine
    try {
      const certificate = await generateCertificate({
        studentId,
        courseId,
        templateId,
        instituteId: targetInstituteId,
        completionDate: completionDate ? new Date(completionDate) : undefined,
      });

      // Notify the student
      try {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { title: true },
        });

        await notifyCertificateIssued({
          userIds: studentId,
          instituteId: targetInstituteId,
          title: "Certificate Issued",
          message: `Congratulations! Your certificate for the course "${course?.title || 'Unknown Course'}" has been issued.`,
          actionUrl: `/dashboard/certificates/${certificate.id}`,
        });
      } catch (notificationError) {
        console.error("[NOTIFICATION FAILURE] Failed to send certificate issued notification:", notificationError);
      }

      await logAction({
        req,
        userId: user.id,
        instituteId: targetInstituteId,
        action: "GENERATE",
        module: "CERTIFICATES",
        entityType: "Certificate",
        entityId: certificate.id,
        description: `Certificate generated for student (ID: ${studentId}) on course (ID: ${courseId})`,
        newValues: certificate,
        status: "SUCCESS",
      });

      return NextResponse.json(certificate, { status: 201 });
    } catch (serviceError: any) {
      console.warn("Certificate Generation Business Rule Failure:", serviceError.message);
      return NextResponse.json(
        { message: serviceError.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("CERTIFICATE GENERATION API ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate certificate", details: error.message },
      { status: 500 }
    );
  }
}
