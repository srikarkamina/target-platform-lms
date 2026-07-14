import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { SystemHealthService } from "@/lib/services/system-health-service";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden: Super Admins only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dashboardType = searchParams.get("dashboard");
    const health = await SystemHealthService.getHealthMetrics();

    let auditAction = "VIEW";
    let auditEntityType = "SystemHealth";
    let auditEntityId = "health";
    let auditDescription = "System health check viewed";

    if (dashboardType === "health") {
      auditAction = "ACCESS";
      auditEntityType = "HealthDashboard";
      auditEntityId = "health-dashboard";
      auditDescription = "Health Dashboard Viewed";
    } else if (dashboardType === "system") {
      auditAction = "ACCESS";
      auditEntityType = "SystemDashboard";
      auditEntityId = "system-dashboard";
      auditDescription = "System Dashboard Viewed";
    } else if (dashboardType === "monitoring") {
      auditAction = "ACCESS";
      auditEntityType = "MonitoringDashboard";
      auditEntityId = "monitoring-dashboard";
      auditDescription = "Monitoring Dashboard Viewed";
    }

    // Log the audit log action
    await logAction({
      req,
      userId: user.id,
      instituteId: "global",
      action: auditAction,
      module: "SUPER_ADMIN",
      entityType: auditEntityType,
      entityId: auditEntityId,
      description: auditDescription,
      status: "SUCCESS",
    });

    return NextResponse.json(health);
  } catch (error) {
    console.error("[GET SYSTEM HEALTH ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
