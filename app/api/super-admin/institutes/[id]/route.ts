import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { updateInstituteSchema } from "@/lib/validations/institute";
import { logAction } from "@/lib/services/audit-service";


export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const institute = await prisma.institute.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!institute) {
      return NextResponse.json({ message: "Institute not found" }, { status: 404 });
    }

    // Fetch related statistics, settings, subscription, and summaries in parallel
    const [
      subscription,
      settings,
      adminUser,
      usageSnapshots,
      studentCount,
      facultyCount,
      courseCount,
      adminCount,
      certificateCount,
      videoStorage,
      submissionStorage,
      recentActivity,
      recentCourses,
      recentUsers,
    ] = await Promise.all([
      prisma.subscription.findUnique({
        where: { instituteId: id },
        include: { plan: true },
      }),
      prisma.instituteSettings.findUnique({
        where: { instituteId: id },
      }),
      prisma.user.findFirst({
        where: { instituteId: id, role: "ADMIN", deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.usageSnapshot.findMany({
        where: { instituteId: id },
        orderBy: { recordedAt: "desc" },
        take: 15,
      }),
      prisma.user.count({ where: { instituteId: id, role: "STUDENT", deletedAt: null } }),
      prisma.user.count({ where: { instituteId: id, role: "FACULTY", deletedAt: null } }),
      prisma.course.count({ where: { instituteId: id, deletedAt: null } }),
      prisma.user.count({ where: { instituteId: id, role: "ADMIN", deletedAt: null } }),
      prisma.certificate.count({ where: { instituteId: id, deletedAt: null } }),
      prisma.video.aggregate({
        where: { course: { instituteId: id }, deletedAt: null },
        _sum: { fileSize: true },
      }),
      prisma.submission.aggregate({
        where: { assignment: { course: { instituteId: id }, deletedAt: null } },
        _sum: { fileSize: true },
      }),
      prisma.auditLog.findMany({
        where: { instituteId: id },
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
        },
      }),
      prisma.course.findMany({
        where: { instituteId: id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          faculty: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { instituteId: id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const storageUsageBytes = (videoStorage._sum.fileSize || 0) + (submissionStorage._sum.fileSize || 0);

    return NextResponse.json({
      institute,
      subscription,
      settings,
      adminUser,
      usageSnapshots,
      statistics: {
        studentCount,
        facultyCount,
        courseCount,
        adminCount,
        certificateCount,
        storageUsageBytes,
      },
      recentActivity,
      coursesSummary: recentCourses,
      usersSummary: {
        recentUsers,
        counts: {
          STUDENT: studentCount,
          FACULTY: facultyCount,
          ADMIN: adminCount,
        },
      },
    });
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTE ID GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const institute = await prisma.institute.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!institute) {
      return NextResponse.json({ message: "Institute not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = updateInstituteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation error", errors: validation.error.format() }, { status: 400 });
    }

    const { name, adminName, adminEmail, adminPhone, logo, promoteConfirmed } = validation.data;

    // Check if new adminEmail already exists globally for other users
    const otherUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (otherUser && otherUser.id !== institute.adminId) {
      if (otherUser.role === "SUPER_ADMIN") {
        return NextResponse.json({ message: "This email is registered to a Super Admin and cannot be used." }, { status: 400 });
      }
      if (otherUser.role === "ADMIN") {
        if (otherUser.instituteId && otherUser.instituteId !== id) {
          return NextResponse.json({ message: "This email is already an admin for another institute." }, { status: 400 });
        }
      }
      if (otherUser.role === "FACULTY" || otherUser.role === "STUDENT") {
        if (promoteConfirmed !== true) {
          return NextResponse.json({
            promotionRequired: true,
            role: otherUser.role,
            message: `This email is registered as a ${otherUser.role}. Do you want to promote them to Institute Admin?`
          }, { status: 200 });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      let adminUser;

      if (otherUser) {
        // We promote/link otherUser
        adminUser = await tx.user.update({
          where: { id: otherUser.id },
          data: {
            name: adminName,
            role: "ADMIN",
            instituteId: id,
          },
        });
      } else if (institute.adminId) {
        // Update current linked admin user
        adminUser = await tx.user.update({
          where: { id: institute.adminId },
          data: {
            name: adminName,
            email: adminEmail,
            role: "ADMIN",
            instituteId: id,
          },
        });
      } else {
        // Create a new Admin User
        adminUser = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            passwordHash: null,
            passwordSet: false,
            role: "ADMIN",
            status: "PENDING_INVITE",
            instituteId: id,
            phone: adminPhone || null,
            provider: "credentials",
            createdBy: user.id,
          },
        });
      }

      const inst = await tx.institute.update({
        where: { id },
        data: {
          name,
          logo: logo || null,
          adminName,
          adminEmail,
          adminPhone: adminPhone || null,
          adminId: adminUser.id,
        },
      });

      // Sync with default settings
      await tx.instituteSettings.upsert({
        where: { instituteId: id },
        update: {
          name,
          logoUrl: logo || null,
          email: adminEmail,
          phone: adminPhone || null,
        },
        create: {
          instituteId: id,
          name,
          logoUrl: logo || null,
          email: adminEmail,
          phone: adminPhone || null,
        },
      });

      return inst;
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: id,
      action: "UPDATE",
      module: "SUPER_ADMIN",
      entityType: "Institute",
      entityId: id,
      description: `Institute profile updated: ${updated.name}`,
      oldValues: institute,
      newValues: updated,
      status: "SUCCESS",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTE ID PATCH]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const institute = await prisma.institute.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!institute) {
      return NextResponse.json({ message: "Institute not found" }, { status: 404 });
    }

    const deleted = await prisma.institute.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: id,
      action: "DELETE",
      module: "SUPER_ADMIN",
      entityType: "Institute",
      entityId: id,
      description: `Institute soft-deleted: ${institute.name}`,
      oldValues: institute,
      newValues: deleted,
      status: "SUCCESS",
    });

    return NextResponse.json({ message: "Institute deleted successfully" });
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTE ID DELETE]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
