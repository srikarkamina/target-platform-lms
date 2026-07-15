import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { AccessRequestService } from "@/lib/services/access-request.service";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const request = await AccessRequestService.getRequestById(id);

    // Create Audit Log for Request Viewed
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        instituteId: "global",
        userId: user.id,
        action: "ACCESS_REQUEST_VIEWED",
        module: "ACCESS_MANAGEMENT",
        entityType: "AccessRequest",
        entityId: id,
        description: `Access request ${request.requestNumber} viewed by ${user.email}`,
        ipAddress: ip,
        userAgent,
        status: "SUCCESS",
      },
    });

    return NextResponse.json(request);
  } catch (error: any) {
    console.error("[GET SUPER ADMIN ACCESS REQUEST DETAIL ERROR]", error);
    return NextResponse.json(
      { message: error.message || "Failed to retrieve access request detail." },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}
