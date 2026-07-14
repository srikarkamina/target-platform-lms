/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     responses:
 *       200:
 *         description: List of enrollments
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCourseEnrolled } from "@/lib/services/notification-service";

export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: true,
        batch: {
          include: {
            course: true,
          },
        },
      },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { studentId, batchId } = body;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        batchId,
      },
    });

    // Fetch batch and course details to notify student
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (batch?.course) {
      try {
        await notifyCourseEnrolled({
          userIds: studentId,
          instituteId: batch.course.instituteId,
          title: "Enrolled in Course",
          message: `You have been enrolled in the course "${batch.course.title}".`,
          actionUrl: `/dashboard/courses/${batch.course.id}`,
        });
      } catch (notificationError) {
        console.error("[NOTIFICATION FAILURE] Failed to send enrollment notification:", notificationError);
      }
    }

    return NextResponse.json(enrollment, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}