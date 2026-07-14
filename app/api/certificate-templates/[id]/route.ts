import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { updateTemplateSchema } from "@/lib/validations/certificate";

/**
 * Helper to fetch a template and verify access permission.
 */
async function authorizeTemplateAccess(req: Request, id: string, allowedRoles: string[]) {
  const payload = await authenticateRequest(req);
  if (!payload) {
    return { status: 401, message: "Unauthorized: Invalid or missing token", user: null, template: null };
  }

  const user = await getAuthorizedUser(payload);
  if (!user) {
    return { status: 401, message: "Unauthorized: User not found", user: null, template: null };
  }

  const template = await prisma.certificateTemplate.findUnique({
    where: { id, deletedAt: null },
  });

  if (!template) {
    return { status: 404, message: "Certificate template not found", user: null, template: null };
  }

  // SUPER_ADMIN has full access
  if (user.role === "SUPER_ADMIN") {
    return { status: 200, user, template };
  }

  // Tenant isolation check
  if (user.instituteId !== template.instituteId) {
    return { status: 403, message: "Forbidden: Tenant mismatch", user: null, template: null };
  }

  // Role validation check
  if (!allowedRoles.includes(user.role)) {
    return { status: 403, message: `Forbidden: Role ${user.role} is not permitted`, user: null, template: null };
  }

  return { status: 200, user, template };
}

/**
 * GET /api/certificate-templates/[id]
 * Fetch a single template.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeTemplateAccess(req, id, ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"]);
    if (auth.status !== 200) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    return NextResponse.json(auth.template);
  } catch (error: any) {
    console.error("GET CERTIFICATE TEMPLATE BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate template", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/certificate-templates/[id]
 * Update certificate template details.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeTemplateAccess(req, id, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.status !== 200) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    // Zod validation
    const validationResult = updateTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...validationResult.data,
        backgroundImageSize: body.backgroundImageSize !== undefined ? (body.backgroundImageSize ? Number(body.backgroundImageSize) : null) : undefined,
        signatureImageSize: body.signatureImageSize !== undefined ? (body.signatureImageSize ? Number(body.signatureImageSize) : null) : undefined,
      },
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      await SubscriptionService.takeUsageSnapshot(updatedTemplate.instituteId);
    } catch (snapshotErr) {
      console.error("[SNAPSHOT FAILURE] Failed to record usage snapshot on template update:", snapshotErr);
    }

    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    console.error("UPDATE CERTIFICATE TEMPLATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update certificate template", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificate-templates/[id]
 * Soft delete a certificate template.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeTemplateAccess(req, id, ["SUPER_ADMIN", "ADMIN"]);
    if (auth.status !== 200) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const deletedTemplate = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      await SubscriptionService.takeUsageSnapshot(deletedTemplate.instituteId);
    } catch (snapshotErr) {
      console.error("[SNAPSHOT FAILURE] Failed to record usage snapshot on template delete:", snapshotErr);
    }

    return NextResponse.json({
      message: "Certificate template successfully deleted",
      id: deletedTemplate.id,
    });
  } catch (error: any) {
    console.error("DELETE CERTIFICATE TEMPLATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete certificate template", details: error.message },
      { status: 500 }
    );
  }
}
