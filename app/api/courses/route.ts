/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     responses:
 *       200:
 *         description: List of courses
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        institute: true,
        faculty: true,
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      courseCode,
      instituteId,
      facultyId,
    } = body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        courseCode,
        instituteId,
        facultyId,
      },
    });

    return NextResponse.json(course, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 }
    );
  }
}