import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: {
      id,
    },
  });

  return NextResponse.json(course);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json();

  const course = await prisma.course.update({
    where: {
      id,
    },
    data: body,
  });

  return NextResponse.json(course);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.course.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "Course deleted",
  });
}