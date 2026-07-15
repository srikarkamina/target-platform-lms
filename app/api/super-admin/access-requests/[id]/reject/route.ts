import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { AccessRequestService } from "@/lib/services/access-request.service";
import { AccessRequestStatus } from "@/app/generated/prisma/client";

export async function PATCH(
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
    const body = await req.json();
    const { reason, notes } = body;

    if (!reason) {
      return NextResponse.json(
        { message: "Please specify a rejection reason." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const reviewNotes = notes ? `${reason}: ${notes}` : reason;

    const request = await AccessRequestService.updateStatus(
      id,
      AccessRequestStatus.REJECTED,
      user.id,
      user.email,
      reviewNotes,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Access request successfully rejected.",
      request,
    });
  } catch (error: any) {
    console.error("[PATCH ACCESS REQUEST REJECT ERROR]", error);
    return NextResponse.json(
      { message: error.message || "Failed to reject access request." },
      { status: 500 }
    );
  }
}
