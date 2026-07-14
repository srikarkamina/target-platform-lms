import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate user
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

    // 2. Fetch certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate || certificate.deletedAt) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    // 3. Tenant isolation check
    if (user.role !== "SUPER_ADMIN" && user.instituteId !== certificate.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Access denied to this tenant's data" },
        { status: 403 }
      );
    }

    // 4. Student ownership check
    if (user.role === "STUDENT" && user.id !== certificate.studentId) {
      return NextResponse.json(
        { message: "Forbidden: You do not own this certificate" },
        { status: 403 }
      );
    }

    // 5. Server-side validation for revocation status
    if (certificate.status === "REVOKED") {
      return NextResponse.json(
        { message: "This certificate has been revoked and cannot be downloaded." },
        { status: 403 }
      );
    }

    await logAction({
      req,
      userId: user.id,
      instituteId: certificate.instituteId,
      action: "DOWNLOAD",
      module: "CERTIFICATES",
      entityType: "Certificate",
      entityId: id,
      description: `Certificate downloaded: ${certificate.certificateNumber}`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      message: "Download authorized",
      certificateNumber: certificate.certificateNumber,
    });
  } catch (error: any) {
    console.error("CERTIFICATE DOWNLOAD AUTHORIZATION ERROR:", error);
    return NextResponse.json(
      { message: "Failed to authorize certificate download", error: error.message },
      { status: 500 }
    );
  }
}
