import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { SubscriptionStatus } from "@/app/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      planId, 
      status, 
      expiresAt, 
      trialEndsAt,
      maxStudents,
      maxFaculty,
      maxCourses,
      storageLimitGB,
      certificateLimit,
      trialDays 
    } = body;

    // Validate status value if provided
    if (status && !Object.values(SubscriptionStatus).includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const currentSub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, institute: true },
    });

    if (!currentSub) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    const updateData: any = {};
    let activePlan = currentSub.plan;

    // Resolve plan selection
    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        return NextResponse.json({ message: "Invalid plan ID" }, { status: 400 });
      }
      activePlan = plan;
    }

    // Determine custom limits overrides mapping
    const studentsDiff = maxStudents !== undefined && maxStudents !== activePlan.maxStudents;
    const facultyDiff = maxFaculty !== undefined && maxFaculty !== activePlan.maxFaculty;
    const coursesDiff = maxCourses !== undefined && maxCourses !== activePlan.maxCourses;
    const storageDiff = storageLimitGB !== undefined && storageLimitGB !== activePlan.storageLimitGB;
    const trialDaysDiff = trialDays !== undefined && trialDays !== activePlan.trialDays;

    const isCustom = studentsDiff || facultyDiff || coursesDiff || storageDiff || trialDaysDiff;

    if (isCustom) {
      // If the current plan is already a custom plan, update it directly
      if (activePlan.code.startsWith("custom-")) {
        const customPlanData: any = {};
        if (maxStudents !== undefined) customPlanData.maxStudents = maxStudents;
        if (maxFaculty !== undefined) customPlanData.maxFaculty = maxFaculty;
        if (maxCourses !== undefined) customPlanData.maxCourses = maxCourses;
        if (storageLimitGB !== undefined) customPlanData.storageLimitGB = storageLimitGB;
        if (trialDays !== undefined) customPlanData.trialDays = trialDays;

        const updatedCustomPlan = await prisma.subscriptionPlan.update({
          where: { id: activePlan.id },
          data: customPlanData,
        });
        activePlan = updatedCustomPlan;
      } else {
        // Otherwise, clone standard plan defaults with overrides into a new custom plan record
        const newCustomPlan = await prisma.subscriptionPlan.create({
          data: {
            code: `custom-${currentSub.instituteId}-${Date.now()}`,
            name: `Custom (${activePlan.name})`,
            price: activePlan.price,
            maxStudents: maxStudents !== undefined ? maxStudents : activePlan.maxStudents,
            maxFaculty: maxFaculty !== undefined ? maxFaculty : activePlan.maxFaculty,
            maxCourses: maxCourses !== undefined ? maxCourses : activePlan.maxCourses,
            maxAdmins: activePlan.maxAdmins,
            storageLimitGB: storageLimitGB !== undefined ? storageLimitGB : activePlan.storageLimitGB,
            trialDays: trialDays !== undefined ? trialDays : activePlan.trialDays,
          },
        });
        updateData.planId = newCustomPlan.id;
        activePlan = newCustomPlan;
      }
    } else {
      // Point directly to standard plan ID if limits are not overridden
      updateData.planId = activePlan.id;
    }

    if (status) {
      updateData.status = status;
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (trialEndsAt !== undefined) {
      updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: { plan: true, institute: true },
    });

    let auditAction = "UPDATE";
    let auditDescription = `Subscription for institute '${updated.institute.name}' updated by Super Admin.`;

    if ((currentSub.status as string) !== (updated.status as string)) {
      if ((updated.status as string) === "SUSPENDED") {
        auditAction = "SUSPEND";
        auditDescription = `Subscription Suspended for institute '${updated.institute.name}' by Super Admin.`;
      } else if ((currentSub.status as string) === "SUSPENDED" && (updated.status as string) !== "SUSPENDED") {
        auditAction = "REACTIVATE";
        auditDescription = `Subscription Reactivated for institute '${updated.institute.name}' by Super Admin.`;
      }
    }

    if (currentSub.planId !== updated.planId) {
      auditDescription = `Subscription Plan Changed for institute '${updated.institute.name}' to ${updated.plan.name} by Super Admin.`;
    }

    await logAction({
      req,
      userId: user.id,
      instituteId: "global",
      action: auditAction,
      module: "SUPER_ADMIN",
      entityType: "Subscription",
      entityId: updated.id,
      description: auditDescription,
      oldValues: currentSub,
      newValues: updated,
      status: "SUCCESS",
    });

    try {
      const { SubscriptionService } = await import("@/lib/services/subscription-service");
      await SubscriptionService.takeUsageSnapshot(updated.instituteId);
    } catch (snapshotErr) {
      console.error("[SNAPSHOT FAILURE] Failed to record usage snapshot on plan update:", snapshotErr);
    }

    // Merge certificateLimit override value in return payload for UI rendering
    const responsePayload = {
      ...updated,
      plan: {
        ...updated.plan,
        certificateLimit: certificateLimit !== undefined ? certificateLimit : null,
      }
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[PATCH SUPER ADMIN SUBSCRIPTION ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { institute: true },
    });

    if (!sub) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: "global",
      action: "DELETE",
      module: "SUPER_ADMIN",
      entityType: "Subscription",
      entityId: id,
      description: `Subscription deleted for institute '${sub.institute.name}'`,
      status: "SUCCESS",
    });

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("[DELETE SUPER ADMIN SUBSCRIPTION ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
