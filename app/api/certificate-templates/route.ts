import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createTemplateSchema } from "@/lib/validations/certificate";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * GET /api/certificate-templates
 * List templates for the institute/tenant.
 * SUPER_ADMIN can view all templates or filter by instituteId query parameter.
 * ADMIN and FACULTY can view templates within their institute.
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

    // Allowed roles to list templates
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Role not authorized to view templates" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const instituteIdParam = searchParams.get("instituteId");

    const where: Prisma.CertificateTemplateWhereInput = {
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

    const templates = await prisma.certificateTemplate.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET CERTIFICATE TEMPLATES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate templates", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificate-templates
 * Create a new template.
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

    // Role check: Only ADMIN and SUPER_ADMIN can create templates
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only Administrators can create templates" },
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
    const validationResult = createTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, title, description, backgroundImage, signatureImage, isActive } = validationResult.data;

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

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        title,
        description,
        backgroundImage: backgroundImage || null,
        backgroundImageSize: body.backgroundImageSize ? Number(body.backgroundImageSize) : null,
        signatureImage: signatureImage || null,
        signatureImageSize: body.signatureImageSize ? Number(body.signatureImageSize) : null,
        isActive: isActive ?? true,
        instituteId: targetInstituteId,
      },
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      await SubscriptionService.takeUsageSnapshot(targetInstituteId);
    } catch (snapshotErr) {
      console.error("[SNAPSHOT FAILURE] Failed to record usage snapshot on template creation:", snapshotErr);
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("CREATE CERTIFICATE TEMPLATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create certificate template", details: error.message },
      { status: 500 }
    );
  }
}
