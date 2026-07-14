import { NextRequest, NextResponse } from "next/server";
import { SystemHealthService } from "@/lib/services/system-health-service";

export async function GET(_req: NextRequest) {
  try {
    const health = await SystemHealthService.getHealthMetrics();
    return NextResponse.json({
      status: health.status,
      timestamp: health.timestamp,
    });
  } catch (error) {
    console.error("[GET SYSTEM STATUS ERROR]", error);
    return NextResponse.json({ status: "unhealthy", details: "Health diagnostic engine unreachable" }, { status: 500 });
  }
}
