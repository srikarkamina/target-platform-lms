import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { PLANS_CONFIG } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: "asc" },
    });

    const augmentedPlans = plans.map((p) => {
      const config = PLANS_CONFIG[p.code] || {};
      return {
        ...p,
        ...config,
      };
    });

    return NextResponse.json(augmentedPlans);
  } catch (error) {
    console.error("[GET SUBSCRIPTION PLANS ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
