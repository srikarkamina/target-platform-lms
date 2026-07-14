import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { notifyCertificateRevoked } from "@/lib/services/notification-service";
import { logAction } from "@/lib/services/audit-service";


/**
 * GET /api/certificates/[id]
 * Fetch details of a single certificate.
 * Accessible to SUPER_ADMIN, ADMIN/FACULTY of same institute, and the STUDENT who owns it.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            facultyId: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            title: true,
            backgroundImage: true,
            signatureImage: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    // SUPER_ADMIN has full access
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(certificate);
    }

    // Tenant Isolation
    if (user.instituteId !== certificate.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Access denied to this tenant's data" },
        { status: 403 }
      );
    }

    // Student ownership check
    if (user.role === "STUDENT" && user.id !== certificate.studentId) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this certificate" },
        { status: 403 }
      );
    }

    // Faculty course check
    if (user.role === "FACULTY" && certificate.course.facultyId !== user.id) {
      return NextResponse.json(
        { message: "Forbidden: You do not teach the course associated with this certificate" },
        { status: 403 }
      );
    }

    return NextResponse.json(certificate);
  } catch (error: any) {
    console.error("GET CERTIFICATE BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/[id]
 * Revokes/soft deletes a certificate.
 * Restricted to ADMIN and SUPER_ADMIN.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { message: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    // Role verification: ADMIN or SUPER_ADMIN only
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can revoke certificates" },
        { status: 403 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    // Tenant boundary check
    if (user.role !== "SUPER_ADMIN" && user.instituteId !== certificate.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Tenant mismatch" },
        { status: 403 }
      );
    }

    // Mark as revoked and set revokedAt
    const revokedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    // Notify student of certificate revocation
    try {
      await notifyCertificateRevoked({
        userIds: certificate.studentId,
        instituteId: certificate.instituteId,
        title: "Certificate Revoked",
        message: `Your certificate for the course "${certificate.course?.title || 'Unknown Course'}" has been revoked.`,
        actionUrl: `/dashboard/certificates`,
      });
    } catch (notificationError) {
      console.error("[NOTIFICATION FAILURE] Failed to notify student of certificate revocation:", notificationError);
    }

    await logAction({
      req,
      userId: user.id,
      instituteId: certificate.instituteId,
      action: "REVOKE",
      module: "CERTIFICATES",
      entityType: "Certificate",
      entityId: id,
      description: `Certificate revoked: ${certificate.certificateNumber}`,
      oldValues: certificate,
      newValues: revokedCertificate,
      status: "SUCCESS",
    });

    return NextResponse.json({
      message: "Certificate revoked successfully",
      id: revokedCertificate.id,
      status: revokedCertificate.status,
    });
  } catch (error: any) {
    console.error("REVOKE CERTIFICATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to revoke certificate", details: error.message },
      { status: 500 }
    );
  }
}
