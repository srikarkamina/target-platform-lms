/**
 * @swagger
 * /api/faculty:
 *   get:
 *     summary: Get all faculty
 *     responses:
 *       200:
 *         description: Faculty list
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET() {
  const faculty = await prisma.user.findMany({
    where: {
      role: "FACULTY",
      deletedAt: null,
    },
  });

  return NextResponse.json(faculty);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify faculty capacity limit
    const canAddFaculty = await SubscriptionService.checkFacultyLimit(body.instituteId);
    if (!canAddFaculty) {
      return NextResponse.json(
        { message: "Faculty enrollment limit reached for this subscription plan. Please upgrade." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const faculty = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "FACULTY",
        instituteId: body.instituteId,
      },
    });

    try {
      const { sendTemplateEmail } = await import("@/lib/services/email-service");
      const instituteObj = await prisma.institute.findUnique({
        where: { id: body.instituteId },
        select: { name: true },
      });
      const instituteName = instituteObj?.name || "Target LMS";

      await sendTemplateEmail({
        recipientEmail: faculty.email,
        type: "WELCOME",
        variables: {
          studentName: faculty.name,
          name: faculty.name,
          instituteName,
        },
        userId: faculty.id,
        instituteId: body.instituteId,
      });
    } catch (welcomeErr) {
      console.error("[WELCOME EMAIL FAILURE] Failed to send welcome email:", welcomeErr);
    }

    try {
      await SubscriptionService.takeUsageSnapshot(body.instituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on faculty creation:", snapshotErr);
    }

    return NextResponse.json(faculty, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create faculty" },
      { status: 500 }
    );
  }
}