import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { getAuditLogs } from "@/lib/services/audit-service";
import { auditLogQuerySchema } from "@/lib/validations/audit";

/**
 * GET /api/institute/audit-logs
 * List audit logs for the institute/tenant.
 * SUPER_ADMIN can view all logs or filter by instituteId query parameter.
 * ADMIN can view logs within their institute.
 * FACULTY and STUDENT are forbidden.
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
        { message: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    // Role-based Access Control
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADMIN" &&
      user.role !== "STUDENT"
    ) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to view audit logs" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const validationResult = auditLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    const result = await getAuditLogs(user, filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET AUDIT LOGS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch audit logs", details: error.message },
      { status: 500 }
    );
  }
}
