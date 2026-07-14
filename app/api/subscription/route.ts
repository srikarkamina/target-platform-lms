import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";

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

    const subscription = await prisma.subscription.findUnique({
      where: { instituteId: user.instituteId || undefined },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ message: "No subscription found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[GET SUBSCRIPTION ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Administrators only" }, { status: 403 });
    }

    const body = await req.json();
    const { planId, autoRenew, status, expiresAt, trialEndsAt } = body;

    if (planId !== undefined || status !== undefined || expiresAt !== undefined || trialEndsAt !== undefined) {
      return NextResponse.json(
        { message: "Forbidden: Plan, status, and expiration limits changes are restricted to Super Admins." },
        { status: 403 }
      );
    }

    const currentSub = await prisma.subscription.findUnique({
      where: { instituteId: user.instituteId || undefined },
      include: { plan: true },
    });

    if (!currentSub) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (autoRenew !== undefined) {
      updateData.autoRenew = autoRenew;
    }

    const updated = await prisma.subscription.update({
      where: { instituteId: user.instituteId || undefined },
      data: updateData,
      include: { plan: true },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "UPDATE",
      module: "SUBSCRIPTIONS",
      entityType: "Subscription",
      entityId: updated.id,
      description: `Subscription self-updated. Plan code: ${updated.plan.code}, status: ${updated.status}`,
      oldValues: currentSub,
      newValues: updated,
      status: "SUCCESS",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH SUBSCRIPTION ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
