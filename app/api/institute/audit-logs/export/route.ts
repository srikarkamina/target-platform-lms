import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { exportAuditLogs } from "@/lib/services/audit-service";
import { auditLogQuerySchema } from "@/lib/validations/audit";

/**
 * GET /api/institute/audit-logs/export
 * Exports filtered audit logs matching standard query parameters as a CSV download.
 * SUPER_ADMIN can export across any institute using ?instituteId query param.
 * ADMIN can export logs within their own institute.
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
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to export audit logs" },
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

    const csvContent = await exportAuditLogs(user, filters);

    // Return as CSV file download response
    const filename = user.instituteId ? `audit-logs-${user.instituteId}-${Date.now()}.csv` : `audit-logs-all-${Date.now()}.csv`;
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("EXPORT AUDIT LOGS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to export audit logs", details: error.message },
      { status: 500 }
    );
  }
}
