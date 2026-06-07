import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: id,
      },
      include: {
        batch: {
          include: {
            course: true,
          },
        },
      },
    });

    const courses = enrollments.map(
      (enrollment) => enrollment.batch.course
    );

    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch student courses" },
      { status: 500 }
    );
  }
}