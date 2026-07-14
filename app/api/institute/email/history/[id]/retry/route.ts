import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { retryEmail } from "@/lib/services/email-service";

export async function POST(
  req: NextRequest,
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

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to retry emails" },
        { status: 403 }
      );
    }

    // Load the email history item to verify tenant boundary
    const logItem = await prisma.emailHistory.findUnique({
      where: { id },
    });

    if (!logItem) {
      return NextResponse.json(
        { message: "Email history record not found" },
        { status: 404 }
      );
    }

    // Tenant Isolation check
    if (user.role !== "SUPER_ADMIN" && logItem.instituteId !== user.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: Tenant isolation violation" },
        { status: 403 }
      );
    }

    // Trigger retry
    await retryEmail(id);

    return NextResponse.json({ message: "Email retry queued successfully." });
  } catch (error: any) {
    console.error("RETRY EMAIL ERROR:", error);
    return NextResponse.json(
      { message: "Failed to queue email retry", details: error.message },
      { status: 500 }
    );
  }
}
