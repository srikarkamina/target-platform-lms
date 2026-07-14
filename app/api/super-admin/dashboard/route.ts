import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { SubscriptionService } from "@/lib/services/subscription-service";

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

    const [
      totalInstitutes,
      activeInstitutes,
      suspendedInstitutes,
      totalStudents,
      totalFaculty,
      totalCourses,
      videoStorage,
      submissionStorage,
      recentActivity,
      newestInstitutes,
      latestLogins,
      activePlans,
      expiredPlans,
    ] = await Promise.all([
      // Total Institutes
      prisma.institute.count({ where: { isDeleted: false } }),
      // Active Institutes
      prisma.institute.count({ where: { isDeleted: false, status: "ACTIVE" } }),
      // Suspended Institutes
      prisma.institute.count({ where: { isDeleted: false, status: "SUSPENDED" } }),
      // Total Students globally
      prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
      // Total Faculty globally
      prisma.user.count({ where: { role: "FACULTY", deletedAt: null } }),
      // Total Courses globally
      prisma.course.count({ where: { deletedAt: null } }),
      // Video storage
      prisma.video.aggregate({
        where: { deletedAt: null },
        _sum: { fileSize: true },
      }),
      // Submission storage
      prisma.submission.aggregate({
        _sum: { fileSize: true },
      }),
      // Recent global activity
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
          institute: {
            select: {
              name: true,
            },
          },
        },
      }),
      // Newest Institutes
      prisma.institute.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Latest Logins
      prisma.auditLog.findMany({
        where: { action: "LOGIN" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          institute: {
            select: {
              name: true,
            },
          },
        },
      }),
      // Active Plans count
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      // Expired Plans count
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
    ]);

    // Most Active Institutes based on AuditLog activity count
    const mostActiveRaw = await prisma.auditLog.groupBy({
      by: ["instituteId"],
      where: {
        instituteId: { not: "global" },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const mostActiveInstitutes = await Promise.all(
      mostActiveRaw.map(async (item) => {
        const inst = await prisma.institute.findFirst({
          where: { id: item.instituteId, isDeleted: false },
          select: { name: true, status: true },
        });
        return {
          id: item.instituteId,
          name: inst?.name || "System/Unknown",
          status: inst?.status || "ACTIVE",
          activityCount: item._count.id,
        };
      })
    );

    // Get all institutes for the stats list
    const institutes = await prisma.institute.findMany({
      where: { isDeleted: false },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const instituteStats = await Promise.all(
      institutes.map(async (inst) => {
        const [students, faculty, courses] = await Promise.all([
          prisma.user.count({ where: { instituteId: inst.id, role: "STUDENT", deletedAt: null } }),
          prisma.user.count({ where: { instituteId: inst.id, role: "FACULTY", deletedAt: null } }),
          prisma.course.count({ where: { instituteId: inst.id, deletedAt: null } }),
        ]);

        const storageUsedMB = await SubscriptionService.calculateStorageUsedMB(inst.id);

        return {
          id: inst.id,
          name: inst.name,
          logo: inst.logo,
          students,
          faculty,
          courses,
          storageGB: parseFloat((storageUsedMB / 1024).toFixed(2)),
          planName: inst.subscription?.plan?.name || "Free",
          status: inst.status,
          subscriptionId: inst.subscription?.id || null,
        };
      })
    );

    const storageUsageBytes = (videoStorage._sum.fileSize || 0) + (submissionStorage._sum.fileSize || 0);

    return NextResponse.json({
      summary: {
        totalInstitutes,
        activeInstitutes,
        suspendedInstitutes,
        totalStudents,
        totalFaculty,
        totalCourses,
        storageUsageBytes,
        activePlans,
        expiredPlans,
      },
      recentActivity,
      newestInstitutes,
      latestLogins,
      mostActiveInstitutes,
      instituteStats,
    });
  } catch (error) {
    console.error("[SUPER ADMIN DASHBOARD GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
