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

    const allowedRoles = ["STUDENT", "SUPER_ADMIN"]; // Permit SUPER_ADMIN for admin debugging if needed
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Students only" },
        { status: 403 }
      );
    }

    // Tenant Isolation Check
    const instituteId = user.instituteId;
    if (!instituteId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: No institute associated with user" },
        { status: 403 }
      );
    }

    // Determine target student ID and institute ID
    const { searchParams } = new URL(req.url);
    let studentId = user.id;
    let targetInstituteId = instituteId || "global";

    if (user.role === "SUPER_ADMIN") {
      const queryStudentId = searchParams.get("studentId");
      if (queryStudentId) {
        studentId = queryStudentId;
      }
      const queryInstituteId = searchParams.get("instituteId");
      if (queryInstituteId) {
        targetInstituteId = queryInstituteId;
      }
    }

    const data = await DashboardService.getStudentDashboardData(studentId, targetInstituteId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET STUDENT DASHBOARD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load Student dashboard metrics" },
      { status: 500 }
    );
  }
}
