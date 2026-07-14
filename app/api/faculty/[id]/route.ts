import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionService } from "@/lib/services/subscription-service";

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

  const targetFaculty = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  try {
    if (targetFaculty.instituteId) {
      await SubscriptionService.takeUsageSnapshot(targetFaculty.instituteId);
    }
  } catch (snapshotErr) {
    console.error("Failed to record usage snapshot on faculty delete:", snapshotErr);
  }

  return NextResponse.json({
    message: "Faculty deleted",
  });
}