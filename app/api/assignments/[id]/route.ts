import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAssignmentSchema } from "@/lib/validations/assignment";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: {
        id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("GET ASSIGNMENT BY ID ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = updateAssignmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignmentExists = await prisma.assignment.findUnique({
      where: {
        id,
      },
    });

    if (!assignmentExists || assignmentExists.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    const updatedAssignment = await prisma.assignment.update({
      where: {
        id,
      },
      data: validation.data,
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("PUT ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if assignment exists
    const assignmentExists = await prisma.assignment.findUnique({
      where: {
        id,
      },
    });

    if (!assignmentExists || assignmentExists.deletedAt) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }

    await prisma.assignment.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("DELETE ASSIGNMENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
