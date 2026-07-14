import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { DashboardService } from "@/lib/services/dashboard-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Missing or invalid token" },
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

    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Administrators only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let instituteId = user.instituteId;

    if (user.role === "SUPER_ADMIN") {
      const queryInstituteId = searchParams.get("instituteId");
      if (queryInstituteId) {
        instituteId = queryInstituteId;
      }
    }

    if (!instituteId) {
      return NextResponse.json(
        { message: "Forbidden: No institute associated with user" },
        { status: 403 }
      );
    }

    const data = await DashboardService.getAdminDashboardData(instituteId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET ADMIN DASHBOARD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load Admin dashboard metrics" },
      { status: 500 }
    );
  }
}
