import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Administrators only" }, { status: 403 });
    }

    const usage = await SubscriptionService.getSubscriptionUsage(user.instituteId || "");
    if (!usage) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    // Fetch historical usage snapshots
    const snapshots = await prisma.usageSnapshot.findMany({
      where: { instituteId: user.instituteId || "" },
      orderBy: { recordedAt: "desc" },
      take: 12,
    });

    return NextResponse.json({
      ...usage,
      history: snapshots,
    });
  } catch (error) {
    console.error("[GET SUBSCRIPTION USAGE ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
