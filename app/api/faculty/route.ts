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

import { SubscriptionService } from "@/lib/services/subscription-service";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const where: any = {
      role: "FACULTY",
      deletedAt: null,
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    const faculty = await prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(faculty);
  } catch (error) {
    console.error("FACULTY GET ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch faculty" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ message: "Forbidden: Administrator access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, department } = body;

    if (!name || !email) {
      return NextResponse.json({ message: "Name and Email are required." }, { status: 400 });
    }

    // Resolve target institute ID
    const targetInstituteId = user.role === "SUPER_ADMIN" ? (body.instituteId || user.instituteId) : user.instituteId;
    if (!targetInstituteId) {
      return NextResponse.json({ message: "Institute ID is required and could not be resolved" }, { status: 400 });
    }

    // Verify faculty capacity limit
    const canAddFaculty = await SubscriptionService.checkFacultyLimit(targetInstituteId);
    if (!canAddFaculty) {
      return NextResponse.json(
        { message: "Faculty enrollment limit reached for this subscription plan. Please upgrade." },
        { status: 400 }
      );
    }

    // Check if email already exists globally
    let faculty = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (faculty) {
      if (faculty.role === "SUPER_ADMIN") {
        return NextResponse.json({ message: "This email is registered to a Super Admin and cannot be used." }, { status: 400 });
      }
      if (faculty.instituteId && faculty.instituteId !== targetInstituteId) {
        return NextResponse.json({ message: "This email belongs to another institute." }, { status: 400 });
      }
      // If belongs to same institute, promote if required
      faculty = await prisma.user.update({
        where: { id: faculty.id },
        data: {
          role: "FACULTY",
          name, // Update name if provided
          phone: phone || faculty.phone,
          department: department || faculty.department,
        },
      });
    } else {
      // Create user with NO password
      faculty = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          passwordSet: false,
          role: "FACULTY",
          instituteId: targetInstituteId,
          phone: phone || null,
          department: department || null,
          status: "PENDING_INVITE",
          provider: "credentials",
          createdBy: user.id,
        },
      });
    }

    try {
      const { sendTemplateEmail } = await import("@/lib/services/email-service");
      const instituteObj = await prisma.institute.findUnique({
        where: { id: targetInstituteId },
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
        instituteId: targetInstituteId,
      });
    } catch (welcomeErr) {
      console.error("[WELCOME EMAIL FAILURE] Failed to send welcome email:", welcomeErr);
    }

    try {
      await SubscriptionService.takeUsageSnapshot(targetInstituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on faculty creation:", snapshotErr);
    }

    return NextResponse.json(faculty, { status: 201 });
  } catch (error: any) {
    console.error("FACULTY POST ERROR:", error);
    return NextResponse.json({ message: "Failed to create faculty", error: error.message }, { status: 500 });
  }
}