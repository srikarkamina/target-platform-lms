import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * GET /api/certificates
 * Lists certificates for the tenant/institute.
 * Restricted to SUPER_ADMIN, ADMIN, and FACULTY.
 * Supports filtering by courseId, status, and searching by student name or certificate number.
 */
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

    // Role check: Only SUPER_ADMIN, ADMIN, and FACULTY can search/list all certificates
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "FACULTY"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to view the certificates list" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const instituteIdParam = searchParams.get("instituteId");

    const where: Prisma.CertificateWhereInput = {
      deletedAt: null,
    };

    // Tenant Isolation
    if (user.role === "SUPER_ADMIN") {
      if (instituteIdParam) {
        where.instituteId = instituteIdParam;
      }
    } else {
      if (!user.instituteId) {
        return NextResponse.json(
          { message: "Forbidden: User has no institute association" },
          { status: 403 }
        );
      }
      where.instituteId = user.instituteId;
    }

    // Course ID Filter
    if (courseId) {
      where.courseId = courseId;
    }

    // Faculty filter: limit to assigned courses
    if (user.role === "FACULTY") {
      where.course = {
        facultyId: user.id,
        deletedAt: null,
      };
    }

    // Status Filter (ACTIVE, REVOKED)
    if (status) {
      if (status === "ACTIVE" || status === "REVOKED") {
        where.status = status;
      }
    }

    // Search Query (Student Name or Certificate Number)
    if (search) {
      where.OR = [
        {
          certificateNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          student: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where,
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
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(certificates);
  } catch (error: any) {
    console.error("GET CERTIFICATES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificates", details: error.message },
      { status: 500 }
    );
  }
}
