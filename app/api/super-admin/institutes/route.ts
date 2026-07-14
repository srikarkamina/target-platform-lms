import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createInstituteSchema } from "@/lib/validations/institute";
import { logAction } from "@/lib/services/audit-service";
import { InstituteStatus, Prisma } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pageVal = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;
    const limitVal = parseInt(searchParams.get("limit") || "10", 10);
    const limit = isNaN(limitVal) || limitVal < 1 ? 10 : limitVal;
    const search = searchParams.get("search");
    const statusParam = searchParams.get("status") as InstituteStatus | null;

    const skip = (page - 1) * limit;

    const where: Prisma.InstituteWhereInput = {
      isDeleted: false,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (statusParam && Object.values(InstituteStatus).includes(statusParam)) {
      where.status = statusParam;
    }

    const [institutes, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.institute.count({ where }),
    ]);

    const [userCounts, courseCounts, certificateCounts, courses] = await Promise.all([
      prisma.user.groupBy({
        by: ["instituteId", "role"],
        where: {
          instituteId: { in: institutes.map((i) => i.id) },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      }),
      prisma.course.groupBy({
        by: ["instituteId"],
        where: {
          instituteId: { in: institutes.map((i) => i.id) },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      }),
      prisma.certificate.groupBy({
        by: ["instituteId"],
        where: {
          instituteId: { in: institutes.map((i) => i.id) },
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      }),
      prisma.course.findMany({
        where: {
          instituteId: { in: institutes.map((i) => i.id) },
          deletedAt: null,
        },
        select: {
          id: true,
          instituteId: true,
        },
      }),
    ]);

    const courseToInstMap: Record<string, string> = {};
    courses.forEach((c) => {
      courseToInstMap[c.id] = c.instituteId;
    });

    const [videoSizes, assignments] = await Promise.all([
      prisma.video.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: courses.map((c) => c.id) },
          deletedAt: null,
        },
        _sum: {
          fileSize: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          courseId: { in: courses.map((c) => c.id) },
          deletedAt: null,
        },
        select: {
          id: true,
          courseId: true,
        },
      }),
    ]);

    const assignmentToInstMap: Record<string, string> = {};
    assignments.forEach((a) => {
      assignmentToInstMap[a.id] = courseToInstMap[a.courseId];
    });

    const submissionSizes = await prisma.submission.groupBy({
      by: ["assignmentId"],
      where: {
        assignmentId: { in: assignments.map((a) => a.id) },
      },
      _sum: {
        fileSize: true,
      },
    });

    const storageMap: Record<string, number> = {};
    institutes.forEach((inst) => {
      storageMap[inst.id] = 0;
    });

    videoSizes.forEach((vs) => {
      const instId = courseToInstMap[vs.courseId];
      if (instId) {
        storageMap[instId] += vs._sum.fileSize || 0;
      }
    });

    submissionSizes.forEach((ss) => {
      const instId = assignmentToInstMap[ss.assignmentId];
      if (instId) {
        storageMap[instId] += ss._sum.fileSize || 0;
      }
    });

    const studentMap: Record<string, number> = {};
    const facultyMap: Record<string, number> = {};
    const courseCountMap: Record<string, number> = {};
    const certificateMap: Record<string, number> = {};

    institutes.forEach((inst) => {
      studentMap[inst.id] = 0;
      facultyMap[inst.id] = 0;
      courseCountMap[inst.id] = 0;
      certificateMap[inst.id] = 0;
    });

    userCounts.forEach((uc) => {
      if (uc.instituteId) {
        if (uc.role === "STUDENT") {
          studentMap[uc.instituteId] = uc._count.id;
        } else if (uc.role === "FACULTY") {
          facultyMap[uc.instituteId] = uc._count.id;
        }
      }
    });

    courseCounts.forEach((cc) => {
      if (cc.instituteId) {
        courseCountMap[cc.instituteId] = cc._count.id;
      }
    });

    certificateCounts.forEach((cc) => {
      if (cc.instituteId) {
        certificateMap[cc.instituteId] = cc._count.id;
      }
    });

    const data = institutes.map((inst) => ({
      ...inst,
      studentCount: studentMap[inst.id] || 0,
      facultyCount: facultyMap[inst.id] || 0,
      courseCount: courseCountMap[inst.id] || 0,
      certificateCount: certificateMap[inst.id] || 0,
      storageUsageBytes: storageMap[inst.id] || 0,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTES GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createInstituteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation error", errors: validation.error.format() }, { status: 400 });
    }

    const {
      name,
      code,
      email,
      phone,
      address,
      website,
      logo,
      city,
      state,
      country,
      pincode,
      adminName,
      adminEmail,
      temporaryPassword,
      planId,
      maxStudents,
      maxFaculty,
      maxCourses,
      storageLimitGB,
      certificateLimit: _certificateLimit,
      trialDays,
    } = validation.data;

    // Check if code is already taken
    const codeToken = `[CODE: ${code.toUpperCase().trim()}]`;
    const existingCode = await prisma.instituteSettings.findFirst({
      where: {
        description: {
          contains: codeToken,
        },
      },
    });
    if (existingCode) {
      return NextResponse.json({ message: "An institute with this code already exists." }, { status: 400 });
    }

    // Check if admin email already exists globally
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return NextResponse.json({ message: "An admin account with this email already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Run transaction
    const institute = await prisma.$transaction(async (tx) => {
      const inst = await tx.institute.create({
        data: {
          name,
          logo: logo || null,
          status: "ACTIVE",
        },
      });

      // Create Settings
      await tx.instituteSettings.create({
        data: {
          instituteId: inst.id,
          name: inst.name,
          logoUrl: logo || null,
          email: email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: pincode || null,
          website: website || null,
          description: codeToken,
        },
      });

      // Create Admin User
      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          instituteId: inst.id,
        },
      });

      // Resolve plan
      const selectedPlan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!selectedPlan) {
        throw new Error("Subscription plan not found");
      }

      let activePlanId = selectedPlan.id;

      // Handle custom limit overrides
      const studentsDiff = maxStudents !== undefined && maxStudents !== null && maxStudents !== selectedPlan.maxStudents;
      const facultyDiff = maxFaculty !== undefined && maxFaculty !== null && maxFaculty !== selectedPlan.maxFaculty;
      const coursesDiff = maxCourses !== undefined && maxCourses !== null && maxCourses !== selectedPlan.maxCourses;
      const storageDiff = storageLimitGB !== undefined && storageLimitGB !== null && storageLimitGB !== selectedPlan.storageLimitGB;
      const trialDaysDiff = trialDays !== undefined && trialDays !== null && trialDays !== selectedPlan.trialDays;

      const isCustom = studentsDiff || facultyDiff || coursesDiff || storageDiff || trialDaysDiff;

      if (isCustom) {
        const newCustomPlan = await tx.subscriptionPlan.create({
          data: {
            code: `custom-${inst.id}-${Date.now()}`,
            name: `Custom (${selectedPlan.name})`,
            price: selectedPlan.price,
            maxStudents: maxStudents !== undefined && maxStudents !== null ? maxStudents : selectedPlan.maxStudents,
            maxFaculty: maxFaculty !== undefined && maxFaculty !== null ? maxFaculty : selectedPlan.maxFaculty,
            maxCourses: maxCourses !== undefined && maxCourses !== null ? maxCourses : selectedPlan.maxCourses,
            maxAdmins: selectedPlan.maxAdmins,
            storageLimitGB: storageLimitGB !== undefined && storageLimitGB !== null ? storageLimitGB : selectedPlan.storageLimitGB,
            trialDays: trialDays !== undefined && trialDays !== null ? trialDays : selectedPlan.trialDays,
          },
        });
        activePlanId = newCustomPlan.id;
      }

      const planTrialDays = trialDays !== undefined && trialDays !== null ? trialDays : selectedPlan.trialDays;

      // Create Subscription
      await tx.subscription.create({
        data: {
          instituteId: inst.id,
          planId: activePlanId,
          status: selectedPlan.price === 0 ? "TRIAL" : "ACTIVE",
          startsAt: new Date(),
          trialEndsAt: selectedPlan.price === 0 ? new Date(Date.now() + planTrialDays * 24 * 60 * 60 * 1000) : null,
          autoRenew: true,
        },
      });

      return inst;
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: "global",
      action: "CREATE",
      module: "SUPER_ADMIN",
      entityType: "Institute",
      entityId: institute.id,
      description: `Institute created: ${institute.name} with admin: ${adminEmail}`,
      newValues: institute,
      status: "SUCCESS",
    });

    // Send Welcome Email if configured (mock/log message)
    try {
      const { sendTemplateEmail } = await import("@/lib/services/email-service");
      await sendTemplateEmail({
        recipientEmail: adminEmail,
        type: "WELCOME",
        variables: {
          studentName: adminName,
          name: adminName,
          instituteName: name,
        },
        userId: undefined,
        instituteId: institute.id,
      });
    } catch {
      console.log("Mock welcome email logged successfully for admin", adminEmail);
    }

    return NextResponse.json(institute, { status: 201 });
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTES POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
