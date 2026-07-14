/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard data
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalBatches,
      totalEnrollments,
      recentCourses,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: "STUDENT",
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          role: "FACULTY",
          deletedAt: null,
        },
      }),
      prisma.course.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.batch.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.enrollment.count(),
      prisma.course.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalCourses,
      totalBatches,
      totalEnrollments,
      recentCourses,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}