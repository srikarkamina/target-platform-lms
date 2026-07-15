import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createInstituteSchema } from "@/lib/validations/institute";
import { logAction } from "@/lib/services/audit-service";
import { InstituteStatus, Prisma } from "@/app/generated/prisma/client";


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
      adminName,
      adminEmail,
      adminPhone,
      logo,
      promoteConfirmed,
    } = validation.data;

    // Generate a unique code from the institute name
    let baseCode = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (baseCode.length < 3) {
      baseCode = "INST" + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    let code = baseCode;
    let codeToken = `[CODE: ${code}]`;
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.instituteSettings.findFirst({
        where: { description: { contains: codeToken } },
      });
      if (!existing) break;
      code = baseCode.slice(0, 7) + Math.random().toString(36).substring(2, 5).toUpperCase();
      codeToken = `[CODE: ${code}]`;
      attempts++;
    }

    // Check if admin email already exists globally
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      if (existingUser.role === "SUPER_ADMIN") {
        return NextResponse.json({ message: "This email is registered to a Super Admin and cannot be used." }, { status: 400 });
      }
      if (existingUser.role === "ADMIN") {
        if (existingUser.instituteId) {
          return NextResponse.json({ message: "This email is already an admin for another institute." }, { status: 400 });
        }
      }
      if (existingUser.role === "FACULTY" || existingUser.role === "STUDENT") {
        if (promoteConfirmed !== true) {
          return NextResponse.json({
            promotionRequired: true,
            role: existingUser.role,
            message: `This email is registered as a ${existingUser.role}. Do you want to promote them to Institute Admin?`
          }, { status: 200 });
        }
      }
    }

    // Run transaction
    const institute = await prisma.$transaction(async (tx) => {
      // 1. Create Institute
      const inst = await tx.institute.create({
        data: {
          name,
          logo: logo || null,
          status: "ACTIVE",
          adminName,
          adminEmail,
          adminPhone: adminPhone || null,
        },
      });

      // 2. Create/Update Admin User
      let adminUser;
      if (existingUser) {
        // Promote FACULTY/STUDENT or associate unlinked ADMIN
        adminUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: "ADMIN",
            instituteId: inst.id,
          },
        });
      } else {
        // Create new Admin User
        adminUser = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            passwordHash: null,
            passwordSet: false,
            role: "ADMIN",
            status: "PENDING_INVITE",
            instituteId: inst.id,
            phone: adminPhone || null,
            provider: "credentials",
            createdBy: user.id,
          },
        });
      }

      // 3. Link admin to Institute
      const updatedInst = await tx.institute.update({
        where: { id: inst.id },
        data: {
          adminId: adminUser.id,
        },
      });

      // 4. Create Settings
      await tx.instituteSettings.create({
        data: {
          instituteId: inst.id,
          name: inst.name,
          logoUrl: logo || null,
          email: adminEmail,
          phone: adminPhone || null,
          description: codeToken,
        },
      });

      // 5. Resolve plan (default to Free plan or first available)
      const selectedPlan = await tx.subscriptionPlan.findUnique({
        where: { code: "free" },
      }) || await tx.subscriptionPlan.findFirst({
        orderBy: { price: "asc" },
      });

      if (!selectedPlan) {
        throw new Error("No subscription plans found in the database. Please seed the database first.");
      }

      // 6. Create Subscription
      await tx.subscription.create({
        data: {
          instituteId: inst.id,
          planId: selectedPlan.id,
          status: selectedPlan.price === 0 ? "TRIAL" : "ACTIVE",
          startsAt: new Date(),
          trialEndsAt: selectedPlan.price === 0 ? new Date(Date.now() + selectedPlan.trialDays * 24 * 60 * 60 * 1000) : null,
          autoRenew: true,
        },
      });

      return updatedInst;
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
