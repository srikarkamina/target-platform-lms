import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";

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
    if (user) {
      await logAction({
        req,
        userId: user.id,
        instituteId: user.instituteId || "global",
        action: "LOGOUT",
        module: "AUTH",
        description: `User ${user.email} logged out successfully`,
        status: "SUCCESS",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("LOGOUT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to logout", error: String(error) },
      { status: 500 }
    );
  }
}
