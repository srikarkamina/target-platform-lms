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