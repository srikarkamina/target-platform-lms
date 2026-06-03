import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const faculty = await prisma.user.findUnique({
    where: { id },
  });

  return NextResponse.json(faculty);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const faculty = await prisma.user.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(faculty);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "Faculty deleted",
  });
}