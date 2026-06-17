import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAssignmentSchema } from "@/lib/validations/assignment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const where: any = {
      deletedAt: null,
    };

    if (courseId) {
      where.courseId = courseId;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET ASSIGNMENTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = createAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { title, description, dueDate, courseId } = validation.data;

    // Check if course exists
    const courseExists = await prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
    });

    if (!courseExists) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate,
        courseId,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
