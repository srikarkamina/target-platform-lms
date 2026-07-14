import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

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

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Only students can access student reports" },
        { status: 403 }
      );
    }

    // 1. Fetch Student's Issued Certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        studentId: user.id,
        deletedAt: null,
      },
      include: {
        course: {
          select: {
            title: true,
            courseCode: true,
          },
        },
        template: {
          select: {
            title: true,
            name: true,
          },
        },
      },
      orderBy: {
        issueDate: "desc",
      },
    });

    // 2. Map Certificates to Analytics
    const reports = certificates.map((cert) => {
      const certificateName = cert.template.title || `${cert.course.title} Completion Certificate`;
      const verificationStatus = cert.status === "ACTIVE" ? "Verified" : "Revoked";

      return {
        certificateId: cert.id,
        certificateName,
        courseCode: cert.course.courseCode,
        courseTitle: cert.course.title,
        issueDate: cert.issueDate,
        verificationStatus,
        certificateNumber: cert.certificateNumber,
        certificateCode: cert.certificateCode,
      };
    });

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error("GET STUDENT CERTIFICATE ANALYTICS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch student certificate analytics" },
      { status: 500 }
    );
  }
}
