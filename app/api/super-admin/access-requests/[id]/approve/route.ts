import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { OnboardingService } from "@/lib/services/onboarding.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      plan,
      trialDurationDays,
      generateTempPassword,
      sendWelcomeEmail,
      createInstitute,
      createInstituteAdmin,
    } = body;

    if (!plan || trialDurationDays === undefined) {
      return NextResponse.json(
        { message: "Please specify a subscription plan and trial duration." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const request = await OnboardingService.approveAndOnboard(
      {
        accessRequestId: id,
        actorId: user.id,
        actorEmail: user.email,
        plan,
        trialDurationDays: parseInt(trialDurationDays, 10),
        generateTempPassword: !!generateTempPassword,
        sendWelcomeEmail: !!sendWelcomeEmail,
        createInstitute: !!createInstitute,
        createInstituteAdmin: !!createInstituteAdmin,
      },
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Access request approved and tenant fully provisioned.",
      request,
    });
  } catch (error: any) {
    console.error("[PATCH ACCESS REQUEST APPROVE ERROR]", error);
    return NextResponse.json(
      { message: error.message || "Failed to process onboarding approval." },
      { status: 500 }
    );
  }
}
